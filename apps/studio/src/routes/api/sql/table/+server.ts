import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/sqlx';

export const GET: RequestHandler = async ({ url }) => {
    const schema = url.searchParams.get('schema');
    const table = url.searchParams.get('table');
    if (!schema || !table) throw error(400, 'Missing schema or table');

    const db = await getDB();

    const cols = await db.query<any>(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE, COLUMN_COMMENT, ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA=? AND TABLE_NAME=?
    ORDER BY ORDINAL_POSITION
  `, [schema, table]);

    const idx = await db.query<any>(`SHOW INDEX FROM \`${schema}\`.\`${table}\``);

    const fks = await db.query<any>(`
    SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
           rc.UPDATE_RULE, rc.DELETE_RULE
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
    JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON rc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
     AND rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
    WHERE k.TABLE_SCHEMA=? AND k.TABLE_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY k.CONSTRAINT_NAME, k.POSITION_IN_UNIQUE_CONSTRAINT
  `, [schema, table]);

    return json({
        columns: cols.rows,
        indexes: idx.rows.filter((r: any) => r.Key_name !== 'PRIMARY'),
        foreignKeys: fks.rows
    });
};
