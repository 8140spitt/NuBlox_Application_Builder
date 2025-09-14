import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        throw redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
    }
    return { user: locals.user };
};
