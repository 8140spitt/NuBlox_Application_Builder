/*
 * NuBlox SQLX — Provider Registry (v0.2)
 */

import type {
  SQLDialect,
  DialectProvider,
  CapabilityMatrix,
  SQLClient
} from './types.js';
import { SQLError } from './types.js';

const SYNONYMS: Record<string, SQLDialect> = {
  // MySQL family
  'mysql': 'mysql',
  'mysql2': 'mysql',
  'mysqlx': 'mysql',
  'mariadb': 'mysql',
  // Postgres family
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'pg': 'postgresql',
  'psql': 'postgresql',
  'cockroach': 'postgresql', // treat as PG dialect initially
  // SQLite
  'sqlite': 'sqlite',
  'file': 'sqlite',
  'sqlite3': 'sqlite',
  ':memory:': 'sqlite',
  // SQL Server
  'sqlserver': 'sqlserver',
  'mssql': 'sqlserver',
  // Oracle
  'oracle': 'oracle',
  'oci': 'oracle',
  // JDBC-ish prefixes (we’ll extract the driver part)
  'jdbc:mysql': 'mysql',
  'jdbc:mariadb': 'mysql',
  'jdbc:postgresql': 'postgresql',
  'jdbc:sqlite': 'sqlite',
  'jdbc:sqlserver': 'sqlserver',
  'jdbc:oracle': 'oracle'
};

function normalizeName(name: string): SQLDialect | null {
  const key = String(name || '').trim().toLowerCase();
  return (SYNONYMS[key] ?? null) as SQLDialect | null;
}

class ProviderRegistry {
  #byDialect = new Map<SQLDialect, DialectProvider>();
  register(provider: DialectProvider) { this.#byDialect.set(provider.dialect, provider); }
  has(d: SQLDialect) { return this.#byDialect.has(d); }
  get(d: SQLDialect) { return this.#byDialect.get(d); }
  list(): SQLDialect[] { return [...this.#byDialect.keys()]; }
}

export const registry = new ProviderRegistry();
export function registerProvider(p: DialectProvider) { registry.register(p); }
export function registerProviders(...ps: DialectProvider[]) { ps.forEach((p) => registry.register(p)); }
export function hasProvider(d: SQLDialect) { return registry.has(d); }
export function getProvider(d: SQLDialect) { return registry.get(d); }
export function getKnownDialects(): SQLDialect[] { return registry.list(); }

export function requireProvider(d: SQLDialect): DialectProvider {
  const p = registry.get(d);
  if (!p) {
    const known = registry.list().join(', ') || '(none registered)';
    throw new SQLError(`No provider registered for dialect "${d}". Known: ${known}`, { dialect: d });
  }
  return p;
}

export type ConnectionConfig = URL | string | Record<string, any>;

const JDBC_RX = /^jdbc:([^:]+):/i;
const SQLITE_FILE_RX = /(^|\/).+\.(db|sqlite3?)$/i;

export function inferDialectFromUrlOrConfig(urlOrCfg: ConnectionConfig): SQLDialect | null {
  try {
    // STRING config
    if (typeof urlOrCfg === 'string') {
      const str = urlOrCfg.trim();

      // 1) Explicit sqlite memory or obvious sqlite file
      if (str === ':memory:' || SQLITE_FILE_RX.test(str)) return 'sqlite';
      if (/^sqlite:/i.test(str)) return 'sqlite';

      // 2) JDBC
      const jdbc = str.match(JDBC_RX);
      if (jdbc) {
        const norm = normalizeName(`jdbc:${jdbc[1]}`);
        if (norm) return norm;
      }

      // 3) URL
      try {
        const u = new URL(str);
        let proto = u.protocol.replace(/:$/, '').toLowerCase();
        // Handle variants like "postgres+ssl" → "postgres"
        proto = proto.replace(/\+.*/, '');
        const norm = normalizeName(proto);
        if (norm) return norm;
      } catch {
        // not a valid URL, fall through
      }

      // 4) Heuristics on plain string
      const lower = str.toLowerCase();
      for (const k of Object.keys(SYNONYMS)) {
        if (lower.includes(k)) return SYNONYMS[k];
      }
      return null;
    }

    // URL object
    if (urlOrCfg instanceof URL) {
      let proto = urlOrCfg.protocol.replace(/:$/, '').toLowerCase();
      proto = proto.replace(/\+.*/, '');
      return normalizeName(proto);
    }

    // Plain object config
    if (urlOrCfg && typeof urlOrCfg === 'object') {
      const cfg: Record<string, any> = urlOrCfg as any;
      // explicit keys we’ll respect
      const keys = ['dialect', 'driver', 'dbms', 'engine', 'type', 'vendor'];
      for (const k of keys) {
        if (cfg[k] != null) {
          const norm = normalizeName(String(cfg[k]));
          if (norm) return norm;
        }
      }
      const port = Number(cfg.port ?? 0);
      if (port === 5432) return 'postgresql';
      if (port === 3306) return 'mysql';
      if (port === 1433) return 'sqlserver';

      // sqlite in object form (file/storage)
      if (typeof cfg.filename === 'string' || typeof cfg.file === 'string' || typeof cfg.storage === 'string') {
        return 'sqlite';
      }
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

export function normalizeConfig(
  urlOrCfg: ConnectionConfig,
  fallbackDialect?: SQLDialect
): { dialect: SQLDialect; config: ConnectionConfig } {
  let dialect = inferDialectFromUrlOrConfig(urlOrCfg) ?? null;
  if (!dialect) {
    if (!fallbackDialect) {
      throw new SQLError('Unable to infer SQL dialect from configuration/URL', { cause: urlOrCfg });
    }
    dialect = fallbackDialect;
  }
  return { dialect, config: urlOrCfg };
}

export async function connect(urlOrCfg: ConnectionConfig, fallbackDialect?: SQLDialect): Promise<SQLClient> {
  const { dialect, config } = normalizeConfig(urlOrCfg, fallbackDialect);
  const provider = requireProvider(dialect);
  return provider.connect(config);
}

/**
 * Convenience helper: connect and immediately load capabilities.
 * Useful for UI gating and generators that must be version-aware.
 */
export async function connectAndDetect(
  urlOrCfg: ConnectionConfig,
  fallbackDialect?: SQLDialect
): Promise<{
  client: SQLClient;
  dialect: SQLDialect;
  capabilities: CapabilityMatrix;
  provider: DialectProvider;
}> {
  const { dialect, config } = normalizeConfig(urlOrCfg, fallbackDialect);
  const provider = requireProvider(dialect);
  const client = await provider.connect(config);
  const capabilities = await client.capabilities(); // per-connection, may be refined by server version
  return { client, dialect, capabilities, provider };
}
