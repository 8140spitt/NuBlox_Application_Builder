import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getDB } from '$lib/server/sqlx';

export const GET: RequestHandler = async () => {
    const db = await getDB();
    // schemas
    const { rows: schemas } = await db.query<{ schema_name: string }>(`
    SELECT SCHEMA_NAME AS schema_name
    FROM INFORMATION_SCHEMA.SCHEMATA
    WHERE SCHEMA_NAME NOT IN ('information_schema','mysql','performance_schema','sys')
    ORDER BY SCHEMA_NAME
  `);

    // tables (first 100 per schema to keep it snappy)
    const tables: Record<string, string[]> = {};
    for (const s of schemas) {
        const { rows } = await db.query<{ table_name: string }>(
            `SELECT TABLE_NAME AS table_name
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE='BASE TABLE'
       ORDER BY TABLE_NAME
       LIMIT 100`, [s.schema_name]);
        tables[s.schema_name] = rows.map(r => r.table_name);
    }

    return json({ schemas: schemas.map(s => s.schema_name), tables });
};
