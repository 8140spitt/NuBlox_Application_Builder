import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        throw redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
    }

    // owner’s workspace (you can switch this to “first membership” if you prefer)
    const rows = await db.query<{ slug: string }>(
        `SELECT slug FROM workspaces WHERE owner_id=? AND deleted_at IS NULL LIMIT 1`,
        [locals.user.id]
    );

    return {
        user: locals.user,
        myWorkspaceSlug: rows[0]?.slug ?? null
    };
};
