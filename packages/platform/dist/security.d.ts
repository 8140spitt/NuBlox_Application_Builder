export type SecurityHeadersOptions = {
    csp?: string;
    frameAncestors?: string;
    originAgentCluster?: boolean;
    crossOriginOpenerPolicy?: string;
    crossOriginEmbedderPolicy?: string;
};
export declare function securityHeaders(opts?: SecurityHeadersOptions): {
    'Content-Security-Policy'?: string | undefined;
    'X-Content-Type-Options': string;
    'X-Frame-Options': string;
    'Referrer-Policy': string;
    'X-DNS-Prefetch-Control': string;
    'Permissions-Policy': string;
    'Cross-Origin-Opener-Policy': string;
    'Cross-Origin-Embedder-Policy': string;
    'Origin-Agent-Cluster': string;
};
