import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/sqlx';

const READ_ONLY = new Set(['SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'WITH']);

function sqlKind(raw: string): string {
    const s = raw
        .replace(/\/\*[\s\S]*?\*\//g, '')      // block comments
        .replace(/^\s*--.*$/gm, '')            // line comments
        .trim();
    const m = s.match(/^([a-z]+)/i);
    return m ? m[1].toUpperCase() : '';
}

export const POST: RequestHandler = async ({ request /*, locals */ }) => {
    const { sql, params, mode } = await request.json().catch(() => ({}));
    if (typeof sql !== 'string' || !sql.trim()) throw error(400, 'Missing SQL');

    // if (!locals.user) throw error(401, 'Unauthorized'); // plug in your auth later

    const kind = sqlKind(sql);
    if (mode !== 'exec' && !READ_ONLY.has(kind)) {
        throw error(400, `Only read-only statements allowed in query mode (got ${kind || 'unknown'})`);
    }

    const db = await getDB();
    try {
        if (mode === 'exec') {
            const res = await db.exec(sql, Array.isArray(params) ? params : []);
            return json({ ok: true, result: res });
        } else {
            const res = await db.query(sql, Array.isArray(params) ? params : [], { trace: true, maxRows: 5000 });
            return json({ ok: true, result: res });
        }
    } catch (e: any) {
        return json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
    }
};
