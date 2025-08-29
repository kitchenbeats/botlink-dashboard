import type { Attributes, Context, TextMapGetter } from '@opentelemetry/api'
import { diag, SpanKind } from '@opentelemetry/api'
import type {
  ReadableSpan,
  Span,
  SpanProcessor,
} from '@opentelemetry/sdk-trace-base'

import { TraceFlags } from '@opentelemetry/api'

type AttributesFromHeaderFunc = <Carrier = unknown>(
  headers: Carrier,
  getter: TextMapGetter<Carrier>
) => Attributes | undefined

type AttributesFromHeaders = Record<string, string> | AttributesFromHeaderFunc

/**
 * Helper ────────────────────────────────────────────────────────────────────
 * Try to obtain the callback that extends the lifetime of the request so that
 * our exporter has time to flush.
 *
 * Priority:
 *   1. `after(cb)`   (Next.js 15)
 *   2. fallback      (best-effort `setTimeout`)
 */
function scheduleAfterResponse(task: () => Promise<void>) {
  try {
    // avoid a hard dependency so this file can be imported outside a route.
    // `require` is evaluated lazily – if Next isn't around it will throw.
    // eslint-disable-next-line
    const mod = require('next/server') as { after?: (cb: () => void) => void }

    if (typeof mod.after === 'function') {
      mod.after(() => {
        // no await – Next treats sync or async the same,
        // we just fire the promise and let it resolve.
        void task()
      })
      return
    }
  } catch {
    /* ignored – we're probably not inside a Next context */
  }

  // 2.  Node / local fallback – try our best and hope the
  //     process stays alive long enough.
  setTimeout(() => {
    void task()
  }, 0)
}

function isSampled(traceFlags: number): boolean {
  // Use bitwise AND to inspect the sampled flag
  return (traceFlags & TraceFlags.SAMPLED) !== 0
}

/** Custom CompositeSpanProcessor for Next.js */
export class NextCompositeSpanProcessor implements SpanProcessor {
  private readonly rootSpanIds = new Map<
    string,
    { rootSpanId: string; open: Span[] }
  >()
  private readonly waitSpanEnd = new Map<string, () => void>()
  /** makes concurrent `forceFlush()` invocations queue instead of collide */
  private flushInFlight: Promise<void> | null = null

  constructor(
    private readonly processors: SpanProcessor[],
    private readonly attributesFromHeaders?: AttributesFromHeaders
  ) {}

  // ───────────────────────────── infrastructure ────────────────────────────
  forceFlush(): Promise<void> {
    // Serialise: if a flush is already happening, share that promise.
    if (this.flushInFlight) return this.flushInFlight

    const flushPromise = Promise.all(
      this.processors.map((p) =>
        p.forceFlush().catch((e) => {
          diag.error('forceFlush failed:', e)
        })
      )
    )
      .then(() => undefined) // ensure Promise<void>
      .catch(() => undefined) // already logged
      .finally(() => {
        this.flushInFlight = null
      })

    this.flushInFlight = flushPromise

    return this.flushInFlight as Promise<void>
  }

  async shutdown(): Promise<void> {
    return Promise.all(
      this.processors.map((p) => p.shutdown().catch(() => undefined))
    ).then(() => undefined)
  }

  // ────────────────────────────────── onStart ──────────────────────────────
  onStart(span: Span, parentContext: Context): void {
    const { traceId, spanId, traceFlags } = span.spanContext()
    const isRoot = !this.rootSpanIds.has(traceId)

    if (isRoot) {
      this.rootSpanIds.set(traceId, { rootSpanId: spanId, open: [] })
    } else {
      this.rootSpanIds.get(traceId)?.open.push(span)
    }

    // Attach request-specific attributes only on the root span
    if (isRoot && isSampled(traceFlags)) {
      // When the *response* (or prerender) is done, flush traces.
      scheduleAfterResponse(async () => {
        if (this.rootSpanIds.has(traceId)) {
          // Root hasn’t finished yet – wait via onEnd().
          const waiter = new Promise<void>((resolve) =>
            this.waitSpanEnd.set(traceId, resolve)
          )
          let timer: NodeJS.Timeout | undefined

          await Promise.race([
            waiter,
            new Promise((res) => {
              timer = setTimeout(() => {
                this.waitSpanEnd.delete(traceId)
                res(undefined)
              }, 50) // same 50 ms guard as Vercel’s impl
            }),
          ])
          if (timer) clearTimeout(timer)
        }

        await this.forceFlush()
      })
    }

    // Fan-out start to underlying processors
    for (const p of this.processors) p.onStart(span, parentContext)
  }

  // ─────────────────────────────────── onEnd ───────────────────────────────
  onEnd(span: ReadableSpan): void {
    const { traceId, spanId, traceFlags } = span.spanContext()
    const root = this.rootSpanIds.get(traceId)
    const isRoot = root?.rootSpanId === spanId

    // Datadog-style resource/operation name enrichment
    if (isSampled(traceFlags)) {
      const resAttrs = getResourceAttributes(span)
      if (resAttrs) Object.assign(span.attributes, resAttrs)
    }

    // Maintain open-span book-keeping
    if (isRoot) {
      // Root finished: no need to force-end children; they will end naturally.
      this.rootSpanIds.delete(traceId)
    } else if (root) {
      root.open = root.open.filter((s) => s.spanContext().spanId !== spanId)
    }

    // Fan-out end
    for (const p of this.processors) p.onEnd(span)

    // Release waiter if anyone is waiting for the root span to finish
    if (isRoot) {
      const pending = this.waitSpanEnd.get(traceId)
      if (pending) {
        this.waitSpanEnd.delete(traceId)
        pending()
      }
    }
  }
}

/* ───────────────────────── Helpers copied from Vercel impl ─────────────── */
const SPAN_KIND_NAME: { [k in SpanKind]: string } = {
  [SpanKind.INTERNAL]: 'internal',
  [SpanKind.SERVER]: 'server',
  [SpanKind.CLIENT]: 'client',
  [SpanKind.PRODUCER]: 'producer',
  [SpanKind.CONSUMER]: 'consumer',
}

function getResourceAttributes(span: ReadableSpan): Attributes | undefined {
  const { kind, attributes } = span
  const {
    'operation.name': opName,
    'resource.name': resName,
    'span.type': spanTypeAttr,
    'next.span_type': nextSpanType,
    'http.method': httpMethod,
    'http.route': httpRoute,
  } = attributes
  if (opName) return undefined

  const resourceName =
    resName ??
    (httpMethod && httpRoute ? `${httpMethod} ${httpRoute}` : httpRoute)

  if (
    kind === SpanKind.SERVER &&
    typeof httpMethod === 'string' &&
    typeof httpRoute === 'string'
  ) {
    return { 'operation.name': 'web.request', 'resource.name': resourceName }
  }

  const spanType = nextSpanType ?? spanTypeAttr
  if (typeof spanType === 'string') {
    return httpRoute
      ? { 'operation.name': spanType, 'resource.name': resourceName }
      : { 'operation.name': spanType }
  }

  return {
    'operation.name':
      kind === SpanKind.INTERNAL ? 'internal' : SPAN_KIND_NAME[kind],
  }
}

function toOperationName(lib: string, name: string) {
  if (!lib) return name
  let clean = lib.replace(/[ @./]/g, '_')
  if (clean.startsWith('_')) clean = clean.slice(1)
  return name ? `${clean}.${name}` : clean
}
