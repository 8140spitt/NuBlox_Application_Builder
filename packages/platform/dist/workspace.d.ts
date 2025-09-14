export type WorkspaceResolution = {
    host: string;
    workspaceSlug: string | null;
};
export declare function resolveWorkspaceFromHost(hostHeader: string, apexDomains?: string[]): WorkspaceResolution;
