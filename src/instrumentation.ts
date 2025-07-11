import { Context } from '@opentelemetry/api'
import {
  ReadableSpan,
  Span,
  SpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

/**
 * Grafana Cloud OTLP Configuration
 *
 * Required Environment Variables:
 * - GRAFANA_OTEL_ENDPOINT: The OTLP endpoint URL (e.g., https://otlp-endpoint-xyz.grafana.net/otlp)
 * - GRAFANA_OTEL_INSTANCE_ID: Your Grafana Cloud instance/stack ID
 * - GRAFANA_OTEL_AUTH: Your Grafana Cloud API key
 *
 * Authentication: Uses Basic Auth with instance ID as username and API key as password
 * Format: Basic base64(instanceId:apiKey)
 *
 * To get these values:
 * 1. Sign in to Grafana Cloud Portal
 * 2. Select your stack
 * 3. Go to Configure > OpenTelemetry
 * 4. Generate API key and copy connection details
 */

/**
 * Span processor to reduce cardinality of span names.
 *
 * Customize with care!
 */
class SpanNameProcessor implements SpanProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve()
  }
  onStart(span: Span, parentContext: Context): void {
    if (span.name.startsWith('GET /_next/static')) {
      span.updateName('GET /_next/static')
    } else if (span.name.startsWith('GET /_next/data')) {
      span.updateName('GET /_next/data')
    } else if (span.name.startsWith('GET /_next/image')) {
      span.updateName('GET /_next/image')
    }
  }
  onEnd(span: ReadableSpan): void {}
  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}

export async function register() {
  const useGrafanaOTEL =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT &&
    process.env.OTEL_EXPORTER_OTLP_HEADERS

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'unknown_service:node',
    spanProcessors: ['auto', new SpanNameProcessor()],
  })

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
    await import('winston')
    await import('winston-loki')
    // @ts-expect-error no types
    await import('next-logger')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
