import type { LayoutServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals, params, url }) => {
    // require auth (defensive; your (app) layout probably does this already)
    if (!locals.user) {
        throw redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
    }

    // find workspace by slug
    const wsRows = await db.query<{ id: number; name: string; slug: string }>(
        `SELECT id, name, slug
       FROM workspaces
      WHERE slug = ? AND deleted_at IS NULL
      LIMIT 1`,
        [params.slug]
    );
    const workspace = wsRows[0];
    if (!workspace) throw error(404, 'Workspace not found');

    // ensure the user is a member (or owner)
    const memRows = await db.query<{ role: string }>(
        `SELECT role
       FROM workspace_members
      WHERE workspace_id = ? AND user_id = ?
      LIMIT 1`,
        [workspace.id, locals.user.id]
    );
    const membership = memRows[0];
    if (!membership) throw error(403, 'You do not have access to this workspace');

    // you can return more data here (e.g., counts, recent projects) if needed
    return {
        workspace,
        membership
    };
};
