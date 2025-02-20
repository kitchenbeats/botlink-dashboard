export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NODE_ENV === 'development'
  ) {
    // @ts-expect-error next-logger is not typed
    await import('next-logger')
    await import('pino')
  }
}
