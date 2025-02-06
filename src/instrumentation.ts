export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await require('pino')
    await require('pino-pretty')
    await require('next-logger')
  }
}
