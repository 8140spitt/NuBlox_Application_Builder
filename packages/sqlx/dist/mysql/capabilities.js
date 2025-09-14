export const BASE_MYSQL_CAPS = {
    ddl: {
        createTable: true,
        alterTable: true,
        dropTable: true,
        createIndex: true,
        alterIndex: true, // via ALTER TABLE ... RENAME/ALTER INDEX
        dropIndex: true,
        createView: true,
        triggers: true,
        sequences: false, // MySQL uses AUTO_INCREMENT
        computedColumns: true // 5.7+ (generated columns)
    },
    dml: {
        upsert: 'on_duplicate', // ON DUPLICATE KEY UPDATE
        returning: false, // MySQL returns via SELECT LAST_INSERT_ID(), not RETURNING
        ctes: false, // 8.0+ -> true at runtime
        windowFunctions: false // 8.0+ -> true at runtime
    },
    dcl: {
        users: true,
        roles: true, // MySQL 8 roles; treat as true and gate with version flag if you want
        grants: true,
        rowLevelSecurity: false
    },
    tcl: {
        savepoints: true,
        setIsolation: true,
        parallelTransactions: false
    },
    misc: {
        explain: true,
        analyze: true, // EXPLAIN ANALYZE (8.0.18+)—we keep true and can downshift at runtime
        serverCursors: false,
        jsonNative: false, // 5.7+ -> true at runtime
        fullTextSearch: true,
        generatedColumns: false // 5.7+ -> true at runtime
    }
};
export function refineByServerVersion(base, versionString) {
    const m = versionString.match(/^(\d+)\.(\d+)\.(\d+)/);
    const major = m ? parseInt(m[1], 10) : 8;
    const minor = m ? parseInt(m[2], 10) : 0;
    const patch = m ? parseInt(m[3], 10) : 0;
    const atLeast = (M, m, p = 0) => major > M || (major === M && (minor > m || (minor === m && patch >= p)));
    const caps = JSON.parse(JSON.stringify(base));
    // DML
    caps.dml.ctes = atLeast(8, 0);
    caps.dml.windowFunctions = atLeast(8, 0);
    // Misc
    caps.misc.jsonNative = atLeast(5, 7);
    caps.misc.generatedColumns = atLeast(5, 7);
    return caps;
}
