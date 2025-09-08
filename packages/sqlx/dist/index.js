// NuBlox SQLX — Barrel exports (MySQL-first)
export * from './core/types.js';
export * from './core/registry.js';
export { mysqlProvider } from './mysql/provider.js';
import { registerProvider } from './core/registry.js';
import { mysqlProvider as _mysqlProvider } from './mysql/provider.js';
/** Convenience helper to register the MySQL provider once at app bootstrap. */
export function registerMySQL() {
    try {
        registerProvider(_mysqlProvider);
    }
    catch { /* idempotent */ }
}
