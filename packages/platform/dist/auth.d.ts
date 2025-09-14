import type { RequestEvent } from './kit.js';
import type { SQLClient } from '@nublox/sqlx';
export type PlatformAuthOptions = {
    cookieName?: string;
    sessionTable?: string;
    ttlSeconds?: number;
    secret: string;
};
/**
 * Attach session helpers to event.locals:
 *  - locals.user:  { id, email } | null (example shape — fill in your query)
 *  - locals.sessionId: string | null
 *  - locals.auth: { signIn(userId), signOut() }
 */
export declare function attachAuth(e: RequestEvent, sql: SQLClient, opts: PlatformAuthOptions): Promise<void>;
