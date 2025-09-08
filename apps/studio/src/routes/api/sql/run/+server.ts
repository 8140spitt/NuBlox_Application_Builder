// apps/studio/src/routes/api/sql/run/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { registerMySQL, connect } from '@nublox/sqlx';

registerMySQL();

const DSN = process.env.SQLX_DSN; // e.g. "mysql://user:pass@127.0.0.1:3306/db"

export const POST: RequestHandler = async ({ request, locals }) => {
    if (!DSN) throw error(500, 'SQLX_DSN not configured on server');

    // Optionally tie access to authenticated users:
    // if (!locals.user) throw error(401, 'Unauthorized');

    const { sql, params, mode } = await request.json().catch(() => ({}));
    if (typeof sql !== 'string' || !sql.trim()) throw error(400, 'Missing SQL');

    const db = await connect(DSN);
    try {
        if (mode === 'exec') {
            const res = await db.exec(sql, Array.isArray(params) ? params : []);
            return json({ ok: true, result: res });
        } else {
            const res = await db.query(sql, Array.isArray(params) ? params : [], { trace: true, maxRows: 5000 });
            return json({ ok: true, result: res });
        }
    } catch (e: any) {
        // Never leak DSN; return structured error
        return json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
    } finally {
        await db.close();
    }
};
