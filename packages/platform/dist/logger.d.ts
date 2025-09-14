import pino from 'pino';
export type Logger = pino.Logger;
export declare function createLogger(name?: string): pino.Logger<never, boolean>;
