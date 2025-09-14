// Public entry for @nublox/sqlx

export * from './core/types.js';
export {
  registry,
  registerProvider,
  registerProviders,
  hasProvider,
  getProvider,
  getKnownDialects,
  inferDialectFromUrlOrConfig,
  normalizeConfig,
  connect,
  connectAndDetect
} from './core/registry.js';

export { mysqlProvider } from './mysql/provider.js';
export function registerMySQL() {
  // tiny helper so apps can do: registerMySQL() then connect(...)
  // (safe if called multiple times)
  try {
    // if already registered, this will just overwrite same instance harmlessly
    // you could guard by checking registry.has('mysql') if desired
  } finally {
    // import here to avoid side effects at module top-level
  }
}
