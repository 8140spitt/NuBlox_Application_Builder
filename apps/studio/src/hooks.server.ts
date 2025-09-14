import type { Handle } from '@sveltejs/kit';
import { platformHandle } from '@nublox/platform';
import { attachAuth } from '@nublox/platform/auth';
import { db } from '$lib/server/db';

const base: Handle = platformHandle();

export const handle: Handle = async ({ event, resolve }) => {
  // 1) Platform security headers + workspace locals
  const res = await base({
    event, resolve: async (evt) => {
      // 2) Attach auth (sessions + cookie)
      const sql = (await db()).client;
      await attachAuth(evt as any, sql, {
        secret: process.env.SESSION_SECRET || 'dev-secret-please-change',
        cookieName: 'nblx_sess',
        ttlSeconds: 60 * 60 * 24 * 7
      });
      return resolve(evt);
    }
  });

  return res;
};
