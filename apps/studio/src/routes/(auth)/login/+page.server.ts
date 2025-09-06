// src: apps/studio/src/routes/(auth)/login/+page.server.ts
import { fail, redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { createSession, validateUsernamePassword } from '$lib/server/auth';
import { db } from '$lib/server/db';

export type ActionData = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
  values?: { username: string };
};

export const load: ServerLoad = async ({ url, locals }) => {
  // already logged in? → bounce to app root
  if (locals.user) {
    const slug = await getWorkspaceSlugForUser(locals.user.id);
    if (slug) throw redirect(303, `/workspace/${slug}`);
  }
  return { next: url.searchParams.get('next') ?? '/' };
};

// helper → choose a workspace slug for this user
async function getWorkspaceSlugForUser(userId: number): Promise<string | null> {
  // Prefer the workspace they OWN
  const owned = await db.query<{ slug: string }>(
    `SELECT slug
       FROM workspaces
      WHERE owner_id = ? AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1`,
    [userId]
  );
  if (owned[0]?.slug) return owned[0].slug;

  // Otherwise, first workspace they are a MEMBER of
  const memberOf = await db.query<{ slug: string }>(
    `SELECT w.slug
       FROM workspaces w
       JOIN workspace_members m ON m.workspace_id = w.id
      WHERE m.user_id = ? AND w.deleted_at IS NULL
      ORDER BY w.created_at ASC
      LIMIT 1`,
    [userId]
  );
  return memberOf[0]?.slug ?? null;
}

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const form = await request.formData();
    const username = String(form.get('username') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const next = String(form.get('next') ?? '/');

    // basic validation
    const fieldErrors: Record<string, string[]> = {};
    if (!username) fieldErrors.username = ['Username is required.'];
    if (!password) fieldErrors.password = ['Password is required.'];
    if (Object.keys(fieldErrors).length) {
      return fail(400, {
        message: 'Please fix the errors below.',
        fieldErrors,
        values: { username }
      } satisfies ActionData);
    }

    // check credentials (users + credentials tables)
    const auth = await validateUsernamePassword(username, password);
    if (!auth) {
      return fail(400, {
        message: 'Invalid username or password.',
        fieldErrors: { username: ['Invalid credentials.'] },
        values: { username }
      } satisfies ActionData);
    }

    // optional: mark last_login_at
    await db.exec(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [auth.userId]);

    // create session in user_sessions and set cookie
    await createSession(cookies, auth.userId, { remember: true });

    // if caller explicitly provided a non-root "next", honor it (e.g., accept-invite)
    if (next && next !== '/' && next !== '') {
      throw redirect(303, next);
    }

    // otherwise send them to their workspace (owner first, else first membership)
    const slug = await getWorkspaceSlugForUser(auth.userId);
    if (slug) throw redirect(303, `/workspace/${slug}`);

    // fallback: no workspace membership found → onboarding
    throw redirect(303, '/onboarding');
  }
};
