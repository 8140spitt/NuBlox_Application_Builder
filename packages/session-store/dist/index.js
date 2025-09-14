const DEFAULTS = {
    table: 'platform_sessions',
    ttlSeconds: 60 * 60 * 24 * 7,
    cleanupProbability: 0.02
};
export function createSessionStore(client, opts = {}) {
    const table = opts.table ?? DEFAULTS.table;
    const ttl = opts.ttlSeconds ?? DEFAULTS.ttlSeconds;
    const p = opts.cleanupProbability ?? DEFAULTS.cleanupProbability;
    async function maybeCleanup() {
        if (Math.random() > p)
            return;
        // delete expired
        await client.exec(`DELETE FROM ${table} WHERE expires_at < NOW()`);
    }
    return {
        async create(userId) {
            await maybeCleanup();
            const expiresAt = new Date(Date.now() + ttl * 1000);
            await client.exec(`INSERT INTO ${table} (user_id, expires_at) VALUES (?, ?)`, [userId, expiresAt]);
            // fetch last insert
            const { rows } = await client.query(`SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id, ? AS user_id, NOW() AS created_at`, [userId]);
            const rec = rows[0];
            return { id: rec.id, user_id: rec.user_id, created_at: rec.created_at };
        },
        async delete(sessionId) {
            await client.exec(`DELETE FROM ${table} WHERE id = ?`, [sessionId]);
        },
        async get(sessionId) {
            const { rows } = await client.query(`SELECT CAST(id AS CHAR) AS id, user_id, created_at
           FROM ${table}
          WHERE id = ? AND expires_at > NOW()
          LIMIT 1`, [sessionId]);
            return rows[0] ?? null;
        }
    };
}
