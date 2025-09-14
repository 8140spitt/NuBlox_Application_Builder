export type SecurityHeadersOptions = {
  csp?: string;
  frameAncestors?: string;
  originAgentCluster?: boolean;
  crossOriginOpenerPolicy?: string;
  crossOriginEmbedderPolicy?: string;
};

export function securityHeaders(opts: SecurityHeadersOptions = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-DNS-Prefetch-Control': 'off',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cross-Origin-Opener-Policy': opts.crossOriginOpenerPolicy ?? 'same-origin',
    'Cross-Origin-Embedder-Policy': opts.crossOriginEmbedderPolicy ?? 'require-corp',
    'Origin-Agent-Cluster': (opts.originAgentCluster ?? true) ? '?1' : '?0',
    ...(opts.csp ? { 'Content-Security-Policy': opts.csp } : {}),
    ...(opts.frameAncestors ? { 'Content-Security-Policy': `${opts.csp ? opts.csp + '; ' : ''}frame-ancestors ${opts.frameAncestors}` } : {})
  };
}
