import type { RequestHandler } from './$types';
import { error, text } from '@sveltejs/kit';
import { getDB } from '$lib/server/sqlx';

const READ_ONLY = new Set(['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'WITH']);
function strip(sql: string) { return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '').trim(); }
function verb(sql: string) { const m = strip(sql).match(/^([a-z]+)/i); return m ? m[1].toUpperCase() : ''; }

function toCSV(rows: any[]): string {
    if (!rows?.length) return '';
    const headers = Object.keys(rows[0]);
    const esc = (v: any) => {
        if (v == null) return '';
        const s = String(v);
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const lines = [headers.map(esc).join(',')];
    for (const r of rows) lines.push(headers.map(h => esc(r[h])).join(','));
    return lines.join('\n');
}

export const POST: RequestHandler = async ({ request }) => {
    const { sql, params, filename } = await request.json().catch(() => ({}));
    if (typeof sql !== 'string' || !sql.trim()) throw error(400, 'Missing SQL');
    if (!READ_ONLY.has(verb(sql))) throw error(400, 'Export only supports read-only queries');

    const db = await getDB();
    const { rows } = await db.query<any>(sql, Array.isArray(params) ? params : [], { maxRows: 100000 });

    const csv = toCSV(rows);
    const name = (filename && String(filename).trim()) || 'export.csv';
    return new Response(csv, {
        headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': `attachment; filename="${name.replace(/[^a-zA-Z0-9._-]/g, '_')}"`
        }
    });
};
