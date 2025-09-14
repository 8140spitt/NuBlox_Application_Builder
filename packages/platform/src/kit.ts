// Local structural types to avoid depending on @sveltejs/kit at build time
export type RequestEvent = {
    request: Request;
    locals: Record<string, any>;
    setHeaders(name: string, value: string): void;
};

export type Handle = (input: {
    event: RequestEvent;
    resolve: (event: RequestEvent) => Promise<Response>;
}) => Promise<Response>;

import { securityHeaders } from './security.js';
import { resolveWorkspaceFromHost } from './workspace.js';

export function applySecurity(e: RequestEvent, extra?: Parameters<typeof securityHeaders>[0]) {
    const h = securityHeaders(extra);
    for (const [k, v] of Object.entries(h)) e.setHeaders(k, v);
}

export function getWorkspaceFromRequest(e: RequestEvent) {
    const host = e.request.headers.get('host') || '';
    return resolveWorkspaceFromHost(host);
}

export function platformHandle(): Handle {
    return async ({ event, resolve }) => {
        applySecurity(event);
        (event.locals as any).workspace = getWorkspaceFromRequest(event);
        return resolve(event);
    };
}
