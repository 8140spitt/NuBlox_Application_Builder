import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/sqlx';

const READ_ONLY = new Set(['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'WITH']);

function stripComments(sql: string) {
    return sql
        .replace(/\/\*[\s\S]*?\*\//g, '')  // /* ... */
        .replace(/--.*$/gm, '')            // -- ...
        .trim();
}
function firstVerb(sql: string) {
    const m = stripComments(sql).match(/^([a-z]+)/i);
    return m ? m[1].toUpperCase() : '';
}
function hasLimit(sql: string) {
    return /\blimit\b/i.test(stripComments(sql));
}
function wrapForCount(sql: string) {
    const s = stripComments(sql).replace(/;+\s*$/, '');
    return `SELECT COUNT(*) AS c FROM (${s}) AS _q`;
}
function wrapForPage(sql: string, page: number, pageSize: number) {
    const s = stripComments(sql).replace(/;+\s*$/, '');
    const off = Math.max(0, (page - 1) * pageSize);
    return `${s} LIMIT ${pageSize} OFFSET ${off}`;
}

export const POST: RequestHandler = async ({ request /*, locals */ }) => {
    const { sql, params, mode, page, pageSize, wantCount } = await request.json().catch(() => ({}));
    if (typeof sql !== 'string' || !sql.trim()) throw error(400, 'Missing SQL');
    const db = await getDB();

    const verb = firstVerb(sql);
    const isRead = READ_ONLY.has(verb);

    try {
        if (mode === 'exec') {
            // exec: allow anything; later we can add a stricter allowlist
            const res = await db.exec(sql, Array.isArray(params) ? params : []);
            return json({ ok: true, result: res });
        }

        if (!isRead) {
            throw error(400, `Only read-only statements allowed in query mode (got ${verb || 'unknown'})`);
        }

        // paging only for SELECT/WITH and only if caller asks for it and the SQL has no LIMIT already
        const usePaging = (verb === 'SELECT' || verb === 'WITH') && Number.isInteger(page) && Number.isInteger(pageSize) && !hasLimit(sql);
        const finalSQL = usePaging ? wrapForPage(sql, Math.max(1, page), Math.max(1, pageSize)) : sql;

        const res = await db.query(finalSQL, Array.isArray(params) ? params : [], { trace: true, maxRows: 10000 });

        let total: number | undefined = undefined;
        if (usePaging && wantCount) {
            const { rows } = await db.query<{ c: number }>(wrapForCount(sql), Array.isArray(params) ? params : []);
            total = rows?.[0]?.c ?? 0;
        }

        return json({ ok: true, result: res, page: usePaging ? page : undefined, pageSize: usePaging ? pageSize : undefined, total });
    } catch (e: any) {
        return json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
    }
};
