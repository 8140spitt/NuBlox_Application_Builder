export * from './core/types.js';
export { registry, registerProvider, registerProviders, hasProvider, getProvider, getKnownDialects, inferDialectFromUrlOrConfig, normalizeConfig, connect, connectAndDetect } from './core/registry.js';
export { mysqlProvider } from './mysql/provider.js';
export declare function registerMySQL(): void;
