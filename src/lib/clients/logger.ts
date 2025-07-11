import type { Logger } from 'winston'

const loggerImpl = ((): Logger => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./logger.node').logger as Logger
  }

  // edge (console) logger will be used in edge or browser runtime

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./logger.edge').logger as Logger
})()

export const l = loggerImpl
export const logger = loggerImpl
export default loggerImpl
