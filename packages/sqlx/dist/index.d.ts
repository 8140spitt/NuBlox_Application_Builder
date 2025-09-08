export * from './core/types.js';
export * from './core/registry.js';
export { mysqlProvider } from './mysql/provider.js';
/** Convenience helper to register the MySQL provider once at app bootstrap. */
export declare function registerMySQL(): void;
