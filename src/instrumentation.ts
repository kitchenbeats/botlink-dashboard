/* eslint-disable */

export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NODE_ENV === 'development'
  ) {
    await require('pino')
    await require('next-logger')
  }
}
