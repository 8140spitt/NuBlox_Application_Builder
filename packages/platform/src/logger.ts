import pino from 'pino';

export type Logger = pino.Logger;

export function createLogger(name = 'nublox') {
    return pino({
        name,
        level: process.env.LOG_LEVEL ?? 'info',
        transport: process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
            : undefined
    });
}
