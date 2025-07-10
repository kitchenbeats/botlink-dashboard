import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import * as Sentry from '@sentry/nextjs'
import { OTLPHttpJsonTraceExporter, registerOTel } from '@vercel/otel'

export async function register() {
  const useGrafanaOTEL =
    process.env.GRAFANA_OTEL_ENDPOINT && process.env.GRAFANA_OTEL_AUTH

  const buildSpanProcessors = () => {
    if (!useGrafanaOTEL) {
      console.info(
        'INSTRUMENTATION:BUILD_SPAN_PROCESSORS',
        'Skipping Grafana OTEL'
      )
      return undefined
    }

    console.info('INSTRUMENTATION:BUILD_SPAN_PROCESSORS', {
      useGrafanaOTEL,
      grafanaOTELEndpoint: process.env.GRAFANA_OTEL_ENDPOINT,
      grafanaOTELAuth: process.env.GRAFANA_OTEL_AUTH,
    })

    return [
      new BatchSpanProcessor(
        new OTLPHttpJsonTraceExporter({
          url: process.env.GRAFANA_OTEL_ENDPOINT,
          headers: {
            Authorization: `Basic ${process.env.GRAFANA_OTEL_AUTH}`,
          },
        })
      ),
    ]
  }

  registerOTel({
    serviceName: 'e2b-dashboard',
    spanProcessors: buildSpanProcessors(),
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
