import { connectAndDetect } from '@nublox/sqlx';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export type RunnerOptions = {
    url?: string;
    dir: string;           // folder with .sql files (ordered by lexicographic name)
    schema?: string;       // schema/name for tracking table
    table?: string;        // table name for tracking (default: platform_migrations)
};

const TRACK_TABLE_DEFAULT = 'platform_migrations';

async function ensureTracking(client: any, name = TRACK_TABLE_DEFAULT) {
    await client.exec(`
    CREATE TABLE IF NOT EXISTS ${name} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);
}

export async function migrate({ url = process.env.DATABASE_URL!, dir, table = TRACK_TABLE_DEFAULT }: RunnerOptions) {
    const { client } = await connectAndDetect(url);

    try {
        await ensureTracking(client, table);
        const files = (await readdir(dir))
            .filter(f => f.endsWith('.sql'))
            .sort((a, b) => a.localeCompare(b));

        // get applied set
        const { rows } = await client.query<{ filename: string }>(`SELECT filename FROM ${table} ORDER BY filename ASC`);
        const applied = new Set(rows.map(r => r.filename));

        for (const f of files) {
            if (applied.has(f)) continue;
            const sql = await readFile(join(dir, f), 'utf8');
            if (!sql.trim()) continue;
            // naive splitter on ; at line end — good enough for our standard migrations
            const statements = sql
                .replace(/\r/g, '')
                .split(/;\s*$/m)
                .map(s => s.trim())
                .filter(Boolean);

            await client.transaction(async (tx) => {
                for (const stmt of statements) {
                    await tx.exec(stmt);
                }
                await tx.exec(`INSERT INTO ${table} (filename) VALUES (?)`, [f]);
            });

            // eslint-disable-next-line no-console
            console.log(`✓ applied ${f}`);
        }
    } finally {
        await client.close();
    }
}
