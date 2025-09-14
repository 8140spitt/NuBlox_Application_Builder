import { setSessionCookie, clearSessionCookie, createToken, verifyToken } from '@nublox/auth';
import { createSessionStore } from '@nublox/session-store';
/**
 * Attach session helpers to event.locals:
 *  - locals.user:  { id, email } | null (example shape — fill in your query)
 *  - locals.sessionId: string | null
 *  - locals.auth: { signIn(userId), signOut() }
 */
export async function attachAuth(e, sql, opts) {
    const cookieName = opts.cookieName ?? 'nblx_sess';
    const store = createSessionStore(sql, { table: opts.sessionTable, ttlSeconds: opts.ttlSeconds });
    const token = e.cookies.get(cookieName);
    let sessionId = null;
    if (token) {
        const maybeId = verifyToken(token, opts.secret);
        if (maybeId)
            sessionId = maybeId;
    }
    let user = null;
    if (sessionId) {
        const rec = await store.get(sessionId);
        if (rec) {
            const { rows } = await sql.query(`SELECT id, email FROM users WHERE id = ? LIMIT 1`, [rec.user_id]);
            user = rows[0] ?? null;
        }
    }
    e.locals.sessionId = sessionId;
    e.locals.user = user;
    e.locals.auth = {
        signIn: async (userId) => {
            const rec = await store.create(userId);
            const jwt = createToken(rec.id, opts.secret);
            setSessionCookie(e.cookies, jwt, { name: cookieName });
            e.locals.sessionId = rec.id;
        },
        signOut: async () => {
            if (sessionId)
                await store.delete(sessionId);
            clearSessionCookie(e.cookies, { name: cookieName });
            e.locals.sessionId = null;
            e.locals.user = null;
        }
    };
}
