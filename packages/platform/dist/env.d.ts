export type PlatformEnv = {
    NODE_ENV: 'development' | 'test' | 'production';
    DATABASE_URL: string;
    SESSION_SECRET: string;
    ORIGIN?: string;
    PORT?: number;
};
export declare function loadEnv(src?: NodeJS.ProcessEnv): PlatformEnv;
