// apps/studio/src/routes/(auth)/register/+page.server.ts
import { fail, redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { hashPassword, createSession } from '$lib/server/auth';
import { db } from '$lib/server/db';
import type { PoolConnection, RowDataPacket, ResultSetHeader } from '@nublox/db';

export type ActionData = {
    message?: string;
    fieldErrors?: Record<string, string[]>;
    values?: { username: string; email: string; first_name: string; last_name: string };
};

export const load: ServerLoad = async ({ locals, url }) => {
    if (locals.user) throw redirect(303, '/');
    return { next: url.searchParams.get('next') ?? '/' };
};

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'workspace';

/** A tagged error type we can throw and safely narrow later */
type DupCode = 'DUP_USERNAME' | 'DUP_EMAIL';
type DupError = Error & { code: DupCode };
const dupError = (code: DupCode, msg = code): DupError => {
    const e = new Error(msg) as DupError;
    e.code = code;
    return e;
};

/** Ensure slug uniqueness inside the same tx connection */
async function ensureUniqueWorkspaceSlug(conn: PoolConnection, base: string): Promise<string> {
    let slug = base;
    let n = 1;

    while (true) {
        const [rows] = await conn.query<RowDataPacket[]>(
            `SELECT id FROM workspaces WHERE slug = ? LIMIT 1`,
            [slug]
        );
        if (rows.length === 0) return slug;
        n += 1;
        slug = `${base}-${n}`;
    }
}

export const actions: Actions = {
    register: async ({ request, cookies, url }) => {
        const form = await request.formData();
        const username = String(form.get('username') ?? '').trim();
        const email = String(form.get('email') ?? '').trim();
        const first_name = String(form.get('first_name') ?? '').trim();
        const last_name = String(form.get('last_name') ?? '').trim();
        const password = String(form.get('password') ?? '');
        const confirm = String(form.get('confirm') ?? '');
        const next = String(form.get('next') ?? url.searchParams.get('next') ?? '/');

        const values = { username, email, first_name, last_name };
        const fieldErrors: Record<string, string[]> = {};
        if (!username) fieldErrors.username = ['Username is required.'];
        if (!email) fieldErrors.email = ['Email is required.'];
        else if (!isEmail(email)) fieldErrors.email = ['Enter a valid email address.'];
        if (!first_name) fieldErrors.first_name = ['First name is required.'];
        if (!last_name) fieldErrors.last_name = ['Last name is required.'];
        if (!password) fieldErrors.password = ['Password is required.'];
        else if (password.length < 8) fieldErrors.password = ['Use at least 8 characters.'];
        if (!confirm) fieldErrors.confirm = ['Please confirm your password.'];
        else if (confirm !== password) fieldErrors.confirm = ['Passwords do not match.'];

        if (Object.keys(fieldErrors).length) {
            return fail(400, { message: 'Please fix the errors below.', fieldErrors, values } satisfies ActionData);
        }

        let userId: number;

        try {
            const { hash, salt } = await hashPassword(password);

            const ids = await db.tx(async (conn: PoolConnection) => {
                // duplicates (fast fail)
                {
                    const [uDup] = await conn.query<RowDataPacket[]>(
                        `SELECT id FROM users WHERE username=? AND deleted_at IS NULL LIMIT 1`,
                        [username]
                    );
                    if (uDup.length) throw dupError('DUP_USERNAME');
                }
                {
                    const [eDup] = await conn.query<RowDataPacket[]>(
                        `SELECT id FROM user_profiles WHERE email=? AND deleted_at IS NULL LIMIT 1`,
                        [email]
                    );
                    if (eDup.length) throw dupError('DUP_EMAIL');
                }

                // user
                const [rUser] = await conn.execute<ResultSetHeader>(
                    `INSERT INTO users (username, status, created_at, updated_at)
           VALUES (?, 'active', NOW(), NOW())`,
                    [username]
                );
                const newUserId = Number(rUser.insertId);
                if (!newUserId) throw new Error('FAILED_INSERT_USER');

                // profile
                await conn.execute<ResultSetHeader>(
                    `INSERT INTO user_profiles (user_id, first_name, last_name, email, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
                    [newUserId, first_name, last_name, email]
                );

                // credential
                await conn.execute<ResultSetHeader>(
                    `INSERT INTO credentials (user_id, credential_type, credential_value_hash, salt, created_at)
           VALUES (?, 'password', ?, ?, NOW())`,
                    [newUserId, hash, salt]
                );

                // workspace (unique slug)
                const baseSlug = slugify(`${username}-workspace`);
                const slug = await ensureUniqueWorkspaceSlug(conn, baseSlug);
                const wsName = `${username}'s Workspace`;
                const [rWs] = await conn.execute<ResultSetHeader>(
                    `INSERT INTO workspaces (owner_id, name, slug, tier, created_at, updated_at)
           VALUES (?, ?, ?, 'free', NOW(), NOW())`,
                    [newUserId, wsName, slug]
                );
                const workspaceId = Number(rWs.insertId);
                if (!workspaceId) throw new Error('FAILED_INSERT_WORKSPACE');

                // member record (owner)
                await conn.execute<ResultSetHeader>(
                    `INSERT INTO workspace_members (workspace_id, user_id, role, created_at, updated_at)
           VALUES (?, ?, 'owner', NOW(), NOW())`,
                    [workspaceId, newUserId]
                );

                return { userId: newUserId };
            });

            userId = ids.userId;
        } catch (err: unknown) {
            // Narrowing helpers
            const isDupErr = (e: unknown): e is DupError =>
                typeof e === 'object' && e !== null && 'code' in e && (e as { code: unknown }).code === 'DUP_USERNAME' ||
                typeof e === 'object' && e !== null && 'code' in e && (e as { code: unknown }).code === 'DUP_EMAIL';

            if (isDupErr(err)) {
                const field = err.code === 'DUP_USERNAME' ? 'username' : 'email';
                return fail(400, {
                    message: 'Please fix the errors below.',
                    fieldErrors: { [field]: [field === 'username' ? 'Username already in use.' : 'Email already in use.'] },
                    values
                } satisfies ActionData);
            }

            const msg = typeof err === 'object' && err && 'message' in err ? String((err as { message?: unknown }).message) : String(err);
            const fe: Record<string, string[]> = {};
            if (/uq_users_username|Duplicate entry .* 'uq_users_username'/i.test(msg)) fe.username = ['Username already in use.'];
            if (/uq_user_profiles_email|Duplicate entry .* 'uq_user_profiles_email'/i.test(msg)) fe.email = ['Email already in use.'];


            console.error('[register] failure:', err);
            return fail(400, {
                message: Object.keys(fe).length ? 'Please fix the errors below.' : 'Registration failed. Please try again.',
                fieldErrors: Object.keys(fe).length ? fe : undefined,
                values
            } satisfies ActionData);
        }

        // success
        await createSession(cookies, userId, { remember: true });
        const ws = await db.query<{ slug: string }>(
            `SELECT slug FROM workspaces WHERE owner_id=? AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`,
            [userId]
        );
        const slug = ws[0]?.slug;
        throw redirect(303, slug ? `/workspace/${slug}` : '/onboarding');
    }
};
