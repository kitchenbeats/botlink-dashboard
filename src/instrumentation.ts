export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('pino-pretty')
    // @ts-expect-error next-logger is not typed
    await import('next-logger')
    await import('pino')
  }
}
