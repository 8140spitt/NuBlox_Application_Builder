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
  if (locals.user) throw redirect(303, '/');
  return { next: url.searchParams.get('next') ?? '/' };
};

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

    // optional: mark last_login_at for analytics/audit
    await db.exec(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, [auth.userId]);

    // create session in user_sessions and set cookie
    await createSession(cookies, auth.userId, { remember: true });

    // go where the app intended
    throw redirect(303, next);
  }
};
