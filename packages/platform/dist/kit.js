import { securityHeaders } from './security.js';
import { resolveWorkspaceFromHost } from './workspace.js';
export function applySecurity(e, extra) {
    const h = securityHeaders(extra);
    for (const [k, v] of Object.entries(h))
        e.setHeaders(k, v);
}
export function getWorkspaceFromRequest(e) {
    const host = e.request.headers.get('host') || '';
    return resolveWorkspaceFromHost(host);
}
export function platformHandle() {
    return async ({ event, resolve }) => {
        applySecurity(event);
        event.locals.workspace = getWorkspaceFromRequest(event);
        return resolve(event);
    };
}
