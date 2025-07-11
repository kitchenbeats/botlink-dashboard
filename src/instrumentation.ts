import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import * as Sentry from '@sentry/nextjs'
import { OTLPHttpJsonTraceExporter, registerOTel } from '@vercel/otel'

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

export async function register() {
  const useGrafanaOTEL =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT &&
    process.env.OTEL_EXPORTER_OTLP_HEADERS

  const buildSpanProcessors = () => {
    if (!useGrafanaOTEL) {
      console.info(
        'INSTRUMENTATION:BUILD_SPAN_PROCESSORS',
        'Skipping Grafana OTEL - missing required environment variables'
      )
      return undefined
    }

    const headers = process.env.OTEL_EXPORTER_OTLP_HEADERS
      ? Object.fromEntries(
          process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map((header) => {
            const [key, value] = header.split('=')
            return [key?.trim(), value?.trim()]
          })
        )
      : undefined

    console.info('INSTRUMENTATION:BUILD_SPAN_PROCESSORS', {
      useGrafanaOTEL,
      grafanaOTELEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      hasAuthToken: !!headers,
    })

    return [
      new BatchSpanProcessor(
        new OTLPHttpJsonTraceExporter({
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
          headers,
        })
      ),
    ]
  }

  registerOTel({
    serviceName: 'dashboard',
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
