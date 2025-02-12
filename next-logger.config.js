import pino from 'pino'

export const logger = defaultConfig =>
  pino({
    level:
      process.env.LOG_LEVEL || process.env.NODE_ENV === 'development'
        ? 'debug'
        : 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
      },
    },
    formatters: {
      level: label => {
        return { level: label }
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      err: pino.stdSerializers.err,
    },
  })
