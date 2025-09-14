// Public entry for @nublox/sqlx
export * from './core/types.js';
export { registry, registerProvider, hasProvider, getProvider, getKnownDialects, inferDialectFromUrlOrConfig, normalizeConfig, connect, connectAndDetect } from './core/registry.js';
import { registerProvider } from './core/registry.js';
import { mysqlProvider } from './mysql/provider.js';
// Auto-register MySQL so it “just works”
registerProvider(mysqlProvider);
export { mysqlProvider };
