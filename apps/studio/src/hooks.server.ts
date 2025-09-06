import type { Handle } from '@sveltejs/kit';
import { readSession } from '$lib/server/auth';



export const handle: Handle = async ({ event, resolve }) => {
  // read session cookie + join user info
  const session = await readSession(event.cookies);
  event.locals.user = session?.user ?? null;

  return resolve(event);
};
