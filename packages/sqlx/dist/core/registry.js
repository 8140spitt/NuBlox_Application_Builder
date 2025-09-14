import { SQLError } from './types.js';
const SYNONYMS = {
    'mysql': 'mysql', 'mysql2': 'mysql', 'mariadb': 'mysql',
    'postgres': 'postgresql', 'postgresql': 'postgresql', 'pg': 'postgresql',
    'sqlite': 'sqlite', 'file': 'sqlite',
    'sqlserver': 'sqlserver', 'mssql': 'sqlserver',
    'oracle': 'oracle', 'oci': 'oracle',
    'jdbc:mysql': 'mysql', 'jdbc:mariadb': 'mysql',
    'jdbc:postgresql': 'postgresql', 'jdbc:sqlite': 'sqlite',
    'jdbc:sqlserver': 'sqlserver', 'jdbc:oracle': 'oracle'
};
function normalizeName(name) {
    const key = String(name || '').trim().toLowerCase();
    return (SYNONYMS[key] ?? null);
}
class ProviderRegistry {
    #byDialect = new Map();
    register(provider) { this.#byDialect.set(provider.dialect, provider); }
    has(d) { return this.#byDialect.has(d); }
    get(d) { return this.#byDialect.get(d); }
    list() { return [...this.#byDialect.keys()]; }
}
export const registry = new ProviderRegistry();
export function registerProvider(p) { registry.register(p); }
export function hasProvider(d) { return registry.has(d); }
export function getProvider(d) { return registry.get(d); }
export function getKnownDialects() { return registry.list(); }
export function requireProvider(d) {
    const p = registry.get(d);
    if (!p) {
        const known = registry.list().join(', ') || '(none registered)';
        throw new SQLError(`No provider registered for dialect "${d}". Known: ${known}`, { dialect: d });
    }
    return p;
}
export function inferDialectFromUrlOrConfig(urlOrCfg) {
    try {
        if (typeof urlOrCfg === 'string') {
            try {
                const u = new URL(urlOrCfg);
                const proto = u.protocol.replace(/:$/, '').toLowerCase();
                const norm = normalizeName(proto);
                if (norm)
                    return norm;
            }
            catch { /* not a URL */ }
            const lower = urlOrCfg.toLowerCase();
            for (const k of Object.keys(SYNONYMS)) {
                if (lower.includes(k))
                    return SYNONYMS[k];
            }
            return null;
        }
        if (urlOrCfg instanceof URL) {
            const proto = urlOrCfg.protocol.replace(/:$/, '').toLowerCase();
            return normalizeName(proto);
        }
        if (urlOrCfg && typeof urlOrCfg === 'object') {
            const keys = ['dialect', 'driver', 'dbms', 'engine', 'type'];
            for (const k of keys) {
                if (k in urlOrCfg && urlOrCfg[k] != null) {
                    const norm = normalizeName(String(urlOrCfg[k]));
                    if (norm)
                        return norm;
                }
            }
            const port = Number(urlOrCfg.port ?? 0);
            if (port === 5432)
                return 'postgresql';
            if (port === 3306)
                return 'mysql';
            if (port === 1433)
                return 'sqlserver';
            if (typeof urlOrCfg.filename === 'string' || typeof urlOrCfg.file === 'string' || typeof urlOrCfg.storage === 'string') {
                return 'sqlite';
            }
            return null;
        }
        return null;
    }
    catch {
        return null;
    }
}
export function normalizeConfig(urlOrCfg, fallbackDialect) {
    let dialect = inferDialectFromUrlOrConfig(urlOrCfg) ?? null;
    if (!dialect) {
        if (!fallbackDialect) {
            throw new SQLError('Unable to infer SQL dialect from configuration/URL', { cause: urlOrCfg });
        }
        dialect = fallbackDialect;
    }
    return { dialect, config: urlOrCfg };
}
export async function connect(urlOrCfg, fallbackDialect) {
    const { dialect, config } = normalizeConfig(urlOrCfg, fallbackDialect);
    const provider = requireProvider(dialect);
    return provider.connect(config);
}
export async function connectAndDetect(urlOrCfg, fallbackDialect) {
    const { dialect, config } = normalizeConfig(urlOrCfg, fallbackDialect);
    const provider = requireProvider(dialect);
    const client = await provider.connect(config);
    return { client, dialect, provider };
}
