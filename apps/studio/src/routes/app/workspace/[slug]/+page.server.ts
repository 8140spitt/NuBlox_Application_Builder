import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
    // Reuse data from +layout.server.ts (workspace, membership, etc.)
    return await parent();
};
