// src: apps/studio/src/routes/(app)/+page.server.ts
import { redirect, type ServerLoad } from '@sveltejs/kit';
import { db } from '$lib/server/db';

async function getWorkspaceSlugForUser(userId: number) {
    const owned = await db.query<{ slug: string }>(
        `SELECT slug FROM workspaces WHERE owner_id=? AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`,
        [userId]
    );
    if (owned[0]?.slug) return owned[0].slug;

    const member = await db.query<{ slug: string }>(
        `SELECT w.slug
       FROM workspaces w
       JOIN workspace_members m ON m.workspace_id = w.id
      WHERE m.user_id=? AND w.deleted_at IS NULL
      ORDER BY w.created_at ASC LIMIT 1`,
        [userId]
    );
    return member[0]?.slug ?? null;
}

export const load: ServerLoad = async ({ locals }) => {
    const user = locals.user!;
    const slug = await getWorkspaceSlugForUser(user.id);
    throw redirect(303, slug ? `/workspace/${slug}` : '/onboarding');
};
