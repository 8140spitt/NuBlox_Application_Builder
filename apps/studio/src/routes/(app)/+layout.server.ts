// src: apps/studio/src/routes/(app)/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    if (!locals.user) throw redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);

    const own = await db.query<{ slug: string }>(
        `SELECT slug FROM workspaces WHERE owner_id=? AND deleted_at IS NULL LIMIT 1`,
        [locals.user.id]
    );
    return { myWorkspaceSlug: own[0]?.slug ?? null };
};
