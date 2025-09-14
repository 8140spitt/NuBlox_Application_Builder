export function resolveWorkspaceFromHost(hostHeader, apexDomains = ['nublox.local', 'nublox.io']) {
    const host = (hostHeader || '').split(':')[0].toLowerCase();
    const apex = apexDomains.find(d => host.endsWith(d));
    if (!apex)
        return { host, workspaceSlug: null };
    const sub = host.slice(0, -(apex.length)).replace(/\.$/, '');
    if (!sub || sub === 'www' || sub === 'app')
        return { host, workspaceSlug: null };
    return { host, workspaceSlug: sub };
}
