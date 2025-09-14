import type { RequestEvent } from './kit.js';
import { setSessionCookie, clearSessionCookie, createToken, verifyToken } from '@nublox/auth';
import { createSessionStore } from '@nublox/session-store';
import type { SQLClient } from '@nublox/sqlx';

export type PlatformAuthOptions = {
    cookieName?: string;
    sessionTable?: string;
    ttlSeconds?: number;
    secret: string;          // SESSION_SECRET
};

/**
 * Attach session helpers to event.locals:
 *  - locals.user:  { id, email } | null (example shape — fill in your query)
 *  - locals.sessionId: string | null
 *  - locals.auth: { signIn(userId), signOut() }
 */
export async function attachAuth(e: RequestEvent, sql: SQLClient, opts: PlatformAuthOptions) {
    const cookieName = opts.cookieName ?? 'nblx_sess';
    const store = createSessionStore(sql, { table: opts.sessionTable, ttlSeconds: opts.ttlSeconds });

    const token = e.cookies.get(cookieName);
    let sessionId: string | null = null;

    if (token) {
        const maybeId = verifyToken(token, opts.secret);
        if (maybeId) sessionId = maybeId;
    }

    let user: any = null;
    if (sessionId) {
        const rec = await store.get(sessionId);
        if (rec) {
            const { rows } = await sql.query<{ id: number; email: string }>(
                `SELECT id, email FROM users WHERE id = ? LIMIT 1`,
                [rec.user_id]
            );
            user = rows[0] ?? null;
        }
    }

    (e.locals as any).sessionId = sessionId;
    (e.locals as any).user = user;

    (e.locals as any).auth = {
        signIn: async (userId: number) => {
            const rec = await store.create(userId);
            const jwt = createToken(rec.id, opts.secret);
            setSessionCookie(e.cookies as any, jwt, { name: cookieName });
            (e.locals as any).sessionId = rec.id;
        },
        signOut: async () => {
            if (sessionId) await store.delete(sessionId);
            clearSessionCookie(e.cookies as any, { name: cookieName });
            (e.locals as any).sessionId = null;
            (e.locals as any).user = null;
        }
    };
}
