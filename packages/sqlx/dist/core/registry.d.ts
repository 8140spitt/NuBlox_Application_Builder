import type { SQLDialect, DialectProvider, CapabilityMatrix, SQLClient } from './types.js';
declare class ProviderRegistry {
    #private;
    register(provider: DialectProvider): void;
    has(d: SQLDialect): boolean;
    get(d: SQLDialect): DialectProvider | undefined;
    list(): SQLDialect[];
}
export declare const registry: ProviderRegistry;
export declare function registerProvider(p: DialectProvider): void;
export declare function registerProviders(...ps: DialectProvider[]): void;
export declare function hasProvider(d: SQLDialect): boolean;
export declare function getProvider(d: SQLDialect): DialectProvider | undefined;
export declare function getKnownDialects(): SQLDialect[];
export declare function requireProvider(d: SQLDialect): DialectProvider;
export type ConnectionConfig = URL | string | Record<string, any>;
export declare function inferDialectFromUrlOrConfig(urlOrCfg: ConnectionConfig): SQLDialect | null;
export declare function normalizeConfig(urlOrCfg: ConnectionConfig, fallbackDialect?: SQLDialect): {
    dialect: SQLDialect;
    config: ConnectionConfig;
};
export declare function connect(urlOrCfg: ConnectionConfig, fallbackDialect?: SQLDialect): Promise<SQLClient>;
/**
 * Convenience helper: connect and immediately load capabilities.
 * Useful for UI gating and generators that must be version-aware.
 */
export declare function connectAndDetect(urlOrCfg: ConnectionConfig, fallbackDialect?: SQLDialect): Promise<{
    client: SQLClient;
    dialect: SQLDialect;
    capabilities: CapabilityMatrix;
    provider: DialectProvider;
}>;
export {};
