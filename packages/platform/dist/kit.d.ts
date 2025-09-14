export type RequestEvent = {
    request: Request;
    locals: Record<string, any>;
    cookies?: any;
    setHeaders(name: string, value: string): void;
};
export type Handle = (input: {
    event: RequestEvent;
    resolve: (event: RequestEvent) => Promise<Response>;
}) => Promise<Response>;
import { securityHeaders } from './security.js';
export declare function applySecurity(e: RequestEvent, extra?: Parameters<typeof securityHeaders>[0]): void;
export declare function getWorkspaceFromRequest(e: RequestEvent): import("./workspace.js").WorkspaceResolution;
export declare function platformHandle(): Handle;
