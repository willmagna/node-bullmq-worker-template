import pino from 'pino';

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      level: process.env.LOG_LEVEL_CONSOLE || 'info',
      options: { translateTime: 'UTC:yyyy-mm-dd HH:MM:ss' },
    },
    {
      target: 'pino/file',
      level: process.env.LOG_LEVEL_FILE || 'warn',
      options: {
        destination: './logs/output.log',
        mkdir: true,
      },
    },
  ],
});

export default pino(
  {
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport,
);
