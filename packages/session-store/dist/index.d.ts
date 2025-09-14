import type { SQLClient } from '@nublox/sqlx';
import type { SessionStore } from '@nublox/auth';
export type SessionStoreOptions = {
    table?: string;
    ttlSeconds?: number;
    cleanupProbability?: number;
};
export declare function createSessionStore(client: SQLClient, opts?: SessionStoreOptions): SessionStore;
