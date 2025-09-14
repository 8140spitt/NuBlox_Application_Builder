import type { SQLClient } from '@nublox/sqlx';
import type { SessionRecord, SessionStore } from '@nublox/auth';

export type SessionStoreOptions = {
    table?: string;               // schema-qualified ok: platform.sessions
    ttlSeconds?: number;          // default 7 days
    cleanupProbability?: number;  // 0..1; default 0.02
};

const DEFAULTS: Required<Pick<SessionStoreOptions, 'table' | 'ttlSeconds' | 'cleanupProbability'>> = {
    table: 'platform_sessions',
    ttlSeconds: 60 * 60 * 24 * 7,
    cleanupProbability: 0.02
};

export function createSessionStore(client: SQLClient, opts: SessionStoreOptions = {}): SessionStore {
    const table = opts.table ?? DEFAULTS.table;
    const ttl = opts.ttlSeconds ?? DEFAULTS.ttlSeconds;
    const p = opts.cleanupProbability ?? DEFAULTS.cleanupProbability;

    async function maybeCleanup() {
        if (Math.random() > p) return;
        // delete expired
        await client.exec(`DELETE FROM ${table} WHERE expires_at < NOW()`);
    }

    return {
        async create(userId: number): Promise<SessionRecord> {
            await maybeCleanup();
            const expiresAt = new Date(Date.now() + ttl * 1000);
            await client.exec(
                `INSERT INTO ${table} (user_id, expires_at) VALUES (?, ?)`,
                [userId, expiresAt]
            );
            // fetch last insert
            const { rows } = await client.query<{ id: string; user_id: number; created_at: Date }>(
                `SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id, ? AS user_id, NOW() AS created_at`,
                [userId]
            );
            const rec = rows[0];
            return { id: rec.id, user_id: rec.user_id, created_at: rec.created_at };
        },

        async delete(sessionId: string): Promise<void> {
            await client.exec(`DELETE FROM ${table} WHERE id = ?`, [sessionId]);
        },

        async get(sessionId: string): Promise<SessionRecord | null> {
            const { rows } = await client.query<SessionRecord & { expires_at: Date }>(
                `SELECT CAST(id AS CHAR) AS id, user_id, created_at
           FROM ${table}
          WHERE id = ? AND expires_at > NOW()
          LIMIT 1`,
                [sessionId]
            );
            return rows[0] ?? null;
        }
    };
}
