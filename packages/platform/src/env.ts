import { v } from '@nublox/validate';

export type PlatformEnv = {
    NODE_ENV: 'development' | 'test' | 'production';
    DATABASE_URL: string;
    SESSION_SECRET: string;
    ORIGIN?: string;
    PORT?: number;
};

const EnvSchema = v.object < PlatformEnv > ({
    NODE_ENV: v.string().oneOf(['development', 'test', 'production']).default('development'),
    DATABASE_URL: v.string().min(5, 'DATABASE_URL required'),
    SESSION_SECRET: v.string().min(16, 'SESSION_SECRET must be >= 16 chars'),
    ORIGIN: v.string().optional(),
    PORT: v.number().int().min(0).optional()
});

export function loadEnv(src: NodeJS.ProcessEnv = process.env): PlatformEnv {
    const parsed: any = {
        NODE_ENV: src.NODE_ENV ?? 'development',
        DATABASE_URL: src.DATABASE_URL,
        SESSION_SECRET: src.SESSION_SECRET,
        ORIGIN: src.ORIGIN,
        PORT: src.PORT ? Number(src.PORT) : undefined
    };
    const res = EnvSchema.safeParse(parsed);
    if (!res.ok) {
        const msgs = res.issues.map(i => `${i.path}: ${i.message}`).join('\n');
        throw new Error(`Invalid environment:\n${msgs}`);
    }
    return res.value;
}
