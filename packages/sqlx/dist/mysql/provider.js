/*
 * NuBlox SQLX — MySQL Provider (v0.1) — patched typings for Pool/PoolConnection
 */
import mysql from 'mysql2/promise';
import { SQLError } from '../core/types.js';
const asConn = (c) => c;
const asPool = (p) => p;
/* Capabilities (conservative base; runtime refined in client.capabilities()) */
export const mysqlCapabilities = {
    ddl: {
        createTable: true,
        alterTable: true,
        dropTable: true,
        createIndex: true,
        alterIndex: false,
        dropIndex: true,
        createView: true,
        triggers: true,
        sequences: false,
        computedColumns: true
    },
    dml: {
        upsert: 'on_duplicate',
        returning: false,
        ctes: false, // refined to true on 8.0+
        windowFunctions: false // refined to true on 8.0+
    },
    dcl: {
        users: true,
        roles: true,
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
        analyze: true,
        serverCursors: false,
        jsonNative: false, // refined to true on 5.7+
        fullTextSearch: true,
        generatedColumns: false // refined to true on 5.7+
    }
};
/* Utils */
function nowMs() { return performance.now(); }
function quoteIdent(name) {
    if (name.includes('`'))
        return '`' + name.replace(/`/g, '``') + '`';
    return '`' + name + '`';
}
function renderQualified(ident) {
    if ('table' in ident && ident.table) {
        return `${quoteIdent(ident.schema)}.${quoteIdent(ident.table)}`;
    }
    return `${quoteIdent(ident.schema)}`;
}
function sqlString(s) { return `'${String(s).replace(/'/g, "''")}'`; }
function mapIsolation(lvl) {
    switch (lvl) {
        case 'read_uncommitted': return 'READ UNCOMMITTED';
        case 'read_committed': return 'READ COMMITTED';
        case 'repeatable_read': return 'REPEATABLE READ';
        case 'serializable': return 'SERIALIZABLE';
        default: return 'REPEATABLE READ';
    }
}
function sqlLiteral(v) {
    if (v === null || v === undefined)
        return 'NULL';
    if (v instanceof Date) {
        const pad = (n) => String(n).padStart(2, '0');
        const y = v.getFullYear();
        const m = pad(v.getMonth() + 1);
        const d = pad(v.getDate());
        const hh = pad(v.getHours());
        const mm = pad(v.getMinutes());
        const ss = pad(v.getSeconds());
        return `'${y}-${m}-${d} ${hh}:${mm}:${ss}'`;
    }
    if (typeof v === 'number')
        return String(v);
    if (typeof v === 'boolean')
        return v ? 'TRUE' : 'FALSE';
    return `'${String(v).replace(/'/g, "''")}'`;
}
/* Prepared Statement */
class MySQLPrepared {
    dialect = 'mysql';
    #stmt;
    constructor(stmt) { this.#stmt = stmt; }
    async query(params = [], options) {
        const t0 = nowMs();
        const [rows, fields] = await this.#stmt.execute(params);
        return {
            rows: rows,
            rowCount: Array.isArray(rows) ? rows.length : 0,
            fields: fields?.map((f) => ({ name: f.name, type: String(f.columnType), nullable: true })) ?? undefined,
            executionMs: options?.trace ? (nowMs() - t0) : undefined
        };
    }
    async exec(params = [], options) {
        const t0 = nowMs();
        const [res] = await this.#stmt.execute(params);
        const ok = res;
        return { affectedRows: ok.affectedRows ?? 0, lastInsertId: ok.insertId ?? null, executionMs: options?.trace ? (nowMs() - t0) : undefined };
    }
    async close() { try {
        await this.#stmt.close();
    }
    catch { } }
}
/* Transaction */
class MySQLTx {
    dialect = 'mysql';
    #conn;
    constructor(conn) { this.#conn = conn; }
    async query(sql, params = [], options) {
        const t0 = nowMs();
        const [rows, fields] = await asConn(this.#conn).query(sql, params);
        return {
            rows: rows,
            rowCount: Array.isArray(rows) ? rows.length : 0,
            fields: fields?.map((f) => ({ name: f.name, type: String(f.columnType), nullable: true })) ?? undefined,
            executionMs: options?.trace ? (nowMs() - t0) : undefined
        };
    }
    async exec(sql, params = [], options) {
        const t0 = nowMs();
        const [res] = await asConn(this.#conn).execute(sql, params);
        const ok = res;
        return { affectedRows: ok.affectedRows ?? 0, lastInsertId: ok.insertId ?? null, executionMs: options?.trace ? (nowMs() - t0) : undefined };
    }
    async prepare(sql) {
        const stmt = await asConn(this.#conn).prepare(sql);
        return new MySQLPrepared(stmt);
    }
    async *stream(sql, params = [], options) {
        const chunk = Math.max(1000, options?.maxRows ?? 1000);
        let offset = 0;
        while (true) {
            const pagedSQL = `${sql} LIMIT ${chunk} OFFSET ${offset}`;
            const { rows } = await this.query(pagedSQL, params, options);
            if (!rows.length)
                break;
            for (const r of rows)
                yield r;
            offset += rows.length;
            if (rows.length < chunk)
                break;
        }
    }
    async savepoint(name = 'sp_' + Date.now()) { await asConn(this.#conn).query(`SAVEPOINT ${quoteIdent(name)}`); }
    async rollback(name) { if (name)
        await asConn(this.#conn).query(`ROLLBACK TO SAVEPOINT ${quoteIdent(name)}`);
    else
        await asConn(this.#conn).query('ROLLBACK'); }
    async release(name = 'sp') { await asConn(this.#conn).query(`RELEASE SAVEPOINT ${quoteIdent(name)}`); }
    async commit() { await asConn(this.#conn).query('COMMIT'); }
}
/* Client */
class MySQLClient {
    dialect = 'mysql';
    #pool;
    #caps;
    constructor(pool) { this.#pool = pool; }
    async query(sql, params = [], options) {
        const t0 = nowMs();
        const [rows, fields] = await asPool(this.#pool).query(sql, params);
        return {
            rows: rows,
            rowCount: Array.isArray(rows) ? rows.length : 0,
            fields: fields?.map((f) => ({ name: f.name, type: String(f.columnType), nullable: true })) ?? undefined,
            executionMs: options?.trace ? (nowMs() - t0) : undefined
        };
    }
    async exec(sql, params = [], options) {
        const t0 = nowMs();
        const [res] = await asPool(this.#pool).execute(sql, params);
        const ok = res;
        return { affectedRows: ok.affectedRows ?? 0, lastInsertId: ok.insertId ?? null, executionMs: options?.trace ? (nowMs() - t0) : undefined };
    }
    async begin(options) {
        const conn = await asPool(this.#pool).getConnection();
        try {
            if (options?.isolation)
                await asConn(conn).query(`SET TRANSACTION ISOLATION LEVEL ${mapIsolation(options.isolation)}`);
            await asConn(conn).query('START TRANSACTION');
            return new MySQLTx(conn);
        }
        catch (e) {
            asConn(conn).release();
            throw e;
        }
    }
    async transaction(fn, options) {
        const conn = await asPool(this.#pool).getConnection();
        try {
            if (options?.isolation)
                await asConn(conn).query(`SET TRANSACTION ISOLATION LEVEL ${mapIsolation(options.isolation)}`);
            await asConn(conn).query('START TRANSACTION');
            const tx = new MySQLTx(conn);
            const out = await fn(tx);
            await asConn(conn).query('COMMIT');
            return out;
        }
        catch (e) {
            try {
                await asConn(conn).query('ROLLBACK');
            }
            catch { }
            throw e;
        }
        finally {
            asConn(conn).release();
        }
    }
    async prepare(sql) {
        const conn = await asPool(this.#pool).getConnection();
        const stmt = await asConn(conn).prepare(sql);
        return new MySQLPrepared(stmt);
    }
    async *stream(sql, params = [], options) {
        const chunk = Math.max(1000, options?.maxRows ?? 1000);
        let offset = 0;
        while (true) {
            const pagedSQL = `${sql} LIMIT ${chunk} OFFSET ${offset}`;
            const { rows } = await this.query(pagedSQL, params, options);
            if (!rows.length)
                break;
            for (const r of rows)
                yield r;
            offset += rows.length;
            if (rows.length < chunk)
                break;
        }
    }
    async close() { await asPool(this.#pool).end(); }
    async capabilities() {
        if (this.#caps)
            return this.#caps;
        try {
            const [rows] = await asPool(this.#pool).query("SELECT @@version AS v, @@version_comment AS c, @@character_set_server AS cs");
            const info = Array.isArray(rows) ? rows[0] : rows;
            const vstr = String(info?.v ?? '8.0.0');
            const m = vstr.match(/^(\d+)\.(\d+)\.(\d+)/);
            const major = m ? parseInt(m[1], 10) : 8;
            const minor = m ? parseInt(m[2], 10) : 0;
            const patch = m ? parseInt(m[3], 10) : 0;
            const atLeast = (M, m, p = 0) => major > M || (major === M && (minor > m || (minor === m && patch >= p)));
            const caps = JSON.parse(JSON.stringify(mysqlCapabilities));
            caps.dml.ctes = atLeast(8, 0);
            caps.dml.windowFunctions = atLeast(8, 0);
            caps.misc.jsonNative = atLeast(5, 7);
            caps.misc.generatedColumns = atLeast(5, 7);
            caps.misc.checkConstraintsEnforced = atLeast(8, 0, 16);
            this.#caps = caps;
        }
        catch {
            this.#caps = mysqlCapabilities;
        }
        return this.#caps;
    }
}
/* Builders */
class MySQLDDL {
    quoteIdent = quoteIdent;
    createTable(ident, def, opts = {}) {
        const qname = renderQualified(ident);
        const cols = def.columns.map(c => {
            const parts = [quoteIdent(c.name), this.renderColumnType(c)];
            if (c.isUnsigned)
                parts.push('UNSIGNED');
            if (c.isAutoIncrement)
                parts.push('AUTO_INCREMENT');
            if (c.nullable === 'not_null')
                parts.push('NOT NULL');
            else
                parts.push('NULL');
            // Computed (generated) columns
            if (c.computedExpr) {
                parts.push(`AS (${c.computedExpr}) ${c.computedStored ? 'STORED' : 'VIRTUAL'}`);
            }
            else {
                // Defaults: prefer param-safe defaultValue, else raw defaultExpr
                if (c.defaultExpr != null) {
                    parts.push(`DEFAULT ${c.defaultExpr}`);
                }
                else if (c.defaultValue !== undefined) {
                    parts.push(`DEFAULT ${sqlLiteral(c.defaultValue)}`);
                }
            }
            if (c.comment)
                parts.push(`COMMENT ${sqlString(c.comment)}`);
            return parts.join(' ');
        });
        if (def.primaryKey?.columns?.length) {
            cols.push(`PRIMARY KEY (${def.primaryKey.columns.map(quoteIdent).join(', ')})`);
        }
        if (def.indexes) {
            for (const idx of def.indexes) {
                const kind = idx.unique ? 'UNIQUE KEY' : 'KEY';
                cols.push(`${kind} ${quoteIdent(idx.name)} (${idx.columns.map(quoteIdent).join(', ')})`);
            }
        }
        if (def.checks) {
            for (const ck of def.checks)
                cols.push(`CONSTRAINT ${quoteIdent(ck.name)} CHECK (${ck.expression})`);
        }
        if (def.foreignKeys) {
            for (const fk of def.foreignKeys) {
                const ref = fk.refSchema && fk.refSchema.schema !== ident.schema
                    ? `${quoteIdent(fk.refSchema.schema)}.${quoteIdent(fk.refTable)}`
                    : quoteIdent(fk.refTable);
                const onUpd = fk.onUpdate ? ` ON UPDATE ${this.mapFKAction(fk.onUpdate)}` : '';
                const onDel = fk.onDelete ? ` ON DELETE ${this.mapFKAction(fk.onDelete)}` : '';
                cols.push(`CONSTRAINT ${quoteIdent(fk.name || `fk_${ident.table}_${fk.columns.join('_')}`)}
          FOREIGN KEY (${fk.columns.map(quoteIdent).join(', ')})
          REFERENCES ${ref} (${fk.refColumns.map(quoteIdent).join(', ')})${onUpd}${onDel}`.replace(/\s+/g, ' '));
            }
        }
        const ifne = opts.ifNotExists ? 'IF NOT EXISTS ' : '';
        const tableComment = opts.tableComment != null
            ? ` COMMENT=${sqlString(String(opts.tableComment))}`
            : '';
        const engine = opts.engine
            ? ` ENGINE=${String(opts.engine)}`
            : ' ENGINE=InnoDB';
        const charset = opts.charset ?? 'utf8mb4';
        const collate = opts.collate ?? 'utf8mb4_0900_ai_ci';
        return `CREATE TABLE ${ifne}${qname} (\n  ${cols.join(',\n  ')}\n)${engine}${tableComment} DEFAULT CHARSET=${charset} COLLATE=${collate};`;
    }
    alterTable(ident, cmd) {
        const qname = renderQualified(ident);
        const statements = [];
        if (cmd.addColumns?.length) {
            for (const c of cmd.addColumns) {
                const def = [quoteIdent(c.name), this.renderColumnType(c)];
                if (c.isUnsigned)
                    def.push('UNSIGNED');
                if (c.isAutoIncrement)
                    def.push('AUTO_INCREMENT');
                if (c.nullable === 'not_null')
                    def.push('NOT NULL');
                else
                    def.push('NULL');
                if (c.computedExpr) {
                    def.push(`AS (${c.computedExpr}) ${c.computedStored ? 'STORED' : 'VIRTUAL'}`);
                }
                else {
                    if (c.defaultExpr != null)
                        def.push(`DEFAULT ${c.defaultExpr}`);
                    else if (c.defaultValue !== undefined)
                        def.push(`DEFAULT ${sqlLiteral(c.defaultValue)}`);
                }
                if (c.comment)
                    def.push(`COMMENT ${sqlString(c.comment)}`);
                statements.push(`ALTER TABLE ${qname} ADD COLUMN ${def.join(' ')};`);
            }
        }
        if (cmd.dropColumns?.length) {
            for (const col of cmd.dropColumns)
                statements.push(`ALTER TABLE ${qname} DROP COLUMN ${quoteIdent(col)};`);
        }
        if (cmd.alterColumns?.length) {
            for (const ac of cmd.alterColumns) {
                if (ac.oldName && ac.name && ac.oldName !== ac.name) {
                    statements.push(`ALTER TABLE ${qname} CHANGE COLUMN ${quoteIdent(ac.oldName)} ${quoteIdent(ac.name)} ${this.renderColumnType(ac)};`);
                }
                else if (ac.name) {
                    statements.push(`ALTER TABLE ${qname} MODIFY COLUMN ${quoteIdent(ac.name)} ${this.renderColumnType(ac)};`);
                }
                else {
                    throw new SQLError('MySQLDDL.alterTable: alterColumns entry must include name (and oldName if renaming).', { dialect: 'mysql' });
                }
            }
        }
        if (cmd.setPrimaryKey !== undefined) {
            if (cmd.setPrimaryKey === null)
                statements.push(`ALTER TABLE ${qname} DROP PRIMARY KEY;`);
            else
                statements.push(`ALTER TABLE ${qname} ADD PRIMARY KEY (${cmd.setPrimaryKey.columns.map(quoteIdent).join(', ')});`);
        }
        if (cmd.addIndexes?.length)
            for (const idx of cmd.addIndexes)
                statements.push(this.createIndex(ident, idx));
        if (cmd.dropIndexes?.length)
            for (const name of cmd.dropIndexes)
                statements.push(this.dropIndex(ident, name));
        if (cmd.addChecks?.length)
            for (const ck of cmd.addChecks)
                statements.push(`ALTER TABLE ${qname} ADD CONSTRAINT ${quoteIdent(ck.name)} CHECK (${ck.expression});`);
        if (cmd.dropChecks?.length)
            for (const name of cmd.dropChecks)
                statements.push(`ALTER TABLE ${qname} DROP CHECK ${quoteIdent(name)};`);
        if (cmd.addForeignKeys?.length) {
            for (const fk of cmd.addForeignKeys) {
                const ref = fk.refSchema && fk.refSchema.schema !== ident.schema
                    ? `${quoteIdent(fk.refSchema.schema)}.${quoteIdent(fk.refTable)}`
                    : quoteIdent(fk.refTable);
                const onUpd = fk.onUpdate ? ` ON UPDATE ${this.mapFKAction(fk.onUpdate)}` : '';
                const onDel = fk.onDelete ? ` ON DELETE ${this.mapFKAction(fk.onDelete)}` : '';
                const name = quoteIdent(fk.name || `fk_${ident.table}_${fk.columns.join('_')}`);
                statements.push(`ALTER TABLE ${qname} ADD CONSTRAINT ${name}
          FOREIGN KEY (${fk.columns.map(quoteIdent).join(', ')})
          REFERENCES ${ref} (${fk.refColumns.map(quoteIdent).join(', ')})${onUpd}${onDel};`.replace(/\s+/g, ' '));
            }
        }
        if (cmd.dropForeignKeys?.length)
            for (const name of cmd.dropForeignKeys)
                statements.push(`ALTER TABLE ${qname} DROP FOREIGN KEY ${quoteIdent(name)};`);
        if (cmd.setComment !== undefined) {
            if (cmd.setComment === null)
                statements.push(`ALTER TABLE ${qname} COMMENT='' ;`);
            else
                statements.push(`ALTER TABLE ${qname} COMMENT=${sqlString(cmd.setComment)};`);
        }
        return statements;
    }
    dropTable(ident, ifExists = true) {
        const qname = renderQualified(ident);
        return `DROP TABLE ${ifExists ? 'IF EXISTS ' : ''}${qname};`;
    }
    createIndex(ident, idx, ifNotExists = false) {
        const qname = renderQualified(ident);
        const kind = idx.unique ? 'UNIQUE' : 'INDEX';
        const ifne = ifNotExists ? 'IF NOT EXISTS ' : '';
        return `CREATE ${kind} ${ifne}${quoteIdent(idx.name)} ON ${qname} (${idx.columns.map(quoteIdent).join(', ')});`;
    }
    dropIndex(ident, name, ifExists = true) {
        const qname = renderQualified(ident);
        const exists = ifExists ? 'IF EXISTS ' : '';
        return `DROP INDEX ${exists}${quoteIdent(name)} ON ${qname};`;
    }
    createView(schema, view, orReplace = false) {
        const qname = `${quoteIdent(schema.schema)}.${quoteIdent(view.name)}`;
        const rep = orReplace ? 'OR REPLACE ' : '';
        return `CREATE ${rep}VIEW ${qname} AS ${view.definitionSQL};`;
    }
    dropView(schema, name, ifExists = true) {
        const qname = `${quoteIdent(schema.schema)}.${quoteIdent(name)}`;
        return `DROP VIEW ${ifExists ? 'IF EXISTS ' : ''}${qname};`;
    }
    renderColumnType(c) {
        const dt = c.dataType.toUpperCase();
        if (/^(VARCHAR|CHAR|BINARY|VARBINARY)$/.test(dt) && c.length)
            return `${dt}(${c.length})`;
        if (/^(DECIMAL|NUMERIC)$/.test(dt) && c.precision != null) {
            const scale = c.scale != null ? `,${c.scale}` : '';
            return `${dt}(${c.precision}${scale})`;
        }
        if (/^(ENUM|SET)$/.test(dt) && c.comment)
            return `${dt}(${c.comment})`;
        return dt;
    }
    mapFKAction(a) {
        switch (a) {
            case 'no_action': return 'NO ACTION';
            case 'restrict': return 'RESTRICT';
            case 'cascade': return 'CASCADE';
            case 'set_null': return 'SET NULL';
            case 'set_default': return 'SET DEFAULT';
        }
    }
}
class MySQLDML {
    upsert(ident, row, conflictKeys, _returning) {
        const cols = Object.keys(row);
        const qname = renderQualified(ident);
        const colList = cols.map(quoteIdent).join(', ');
        const values = cols.map(() => '?').join(', ');
        const updates = cols
            .filter(c => !conflictKeys.includes(c))
            .map(c => `${quoteIdent(c)}=VALUES(${quoteIdent(c)})`)
            .join(', ');
        return `INSERT INTO ${qname} (${colList}) VALUES (${values}) ON DUPLICATE KEY UPDATE ${updates};`;
    }
}
class MySQLDCL {
    createUser(username, options) {
        const host = options?.host ?? '%';
        const identified = options?.identifiedBy ? ` IDENTIFIED BY ${sqlString(String(options.identifiedBy))}` : '';
        return `CREATE USER ${sqlString(username)}@${sqlString(host)}${identified};`;
    }
    dropUser(username, ifExists = true) {
        return `DROP USER ${ifExists ? 'IF EXISTS ' : ''}${sqlString(username)}@${sqlString('%')};`;
    }
    createRole(role) { return `CREATE ROLE ${quoteIdent(role)};`; }
    dropRole(role, ifExists = true) { return `DROP ROLE ${ifExists ? 'IF EXISTS ' : ''}${quoteIdent(role)};`; }
    grant(priv, on, to) {
        let target = '*.*';
        if (on.table)
            target = `${quoteIdent(on.table.schema)}.${quoteIdent(on.table.table)}`;
        else if (on.schema)
            target = `${quoteIdent(on.schema.schema)}.*`;
        else if (on.database)
            target = `${quoteIdent(on.database)}.*`;
        return `GRANT ${priv} ON ${target} TO ${to};`;
    }
    revoke(priv, on, from) {
        let target = '*.*';
        if (on.table)
            target = `${quoteIdent(on.table.schema)}.${quoteIdent(on.table.table)}`;
        else if (on.schema)
            target = `${quoteIdent(on.schema.schema)}.*`;
        else if (on.database)
            target = `${quoteIdent(on.database)}.*`;
        return `REVOKE ${priv} ON ${target} FROM ${from};`;
    }
}
class MySQLTCL {
    begin() { return 'START TRANSACTION'; }
    commit() { return 'COMMIT'; }
    rollback() { return 'ROLLBACK'; }
    savepoint(name) { return `SAVEPOINT ${quoteIdent(name)}`; }
    rollbackTo(name) { return `ROLLBACK TO SAVEPOINT ${quoteIdent(name)}`; }
    releaseSavepoint(name) { return `RELEASE SAVEPOINT ${quoteIdent(name)}`; }
    setIsolation(lvl) { return `SET TRANSACTION ISOLATION LEVEL ${mapIsolation(lvl)}`; }
}
/* Introspector */
class MySQLIntrospector {
    #client;
    constructor(client) { this.#client = client; }
    async snapshot(schemas) {
        const filter = schemas && schemas.length ? `AND SCHEMA_NAME IN (${schemas.map(s => sqlString(s)).join(',')})` : '';
        const schemaRows = await this.#client.query(`SELECT SCHEMA_NAME AS schema_name FROM INFORMATION_SCHEMA.SCHEMATA WHERE 1=1 ${filter} ORDER BY SCHEMA_NAME`);
        const schemasList = schemaRows.rows.map(r => ({ schema: r.schema_name }));
        const tables = await this.tablesForSchemas(schemasList.map(s => s.schema));
        return { dialect: 'mysql', capturedAt: new Date(), schemas: schemasList, tables };
    }
    async table(ident) {
        const tables = await this.tablesForSchemas([ident.schema], ident.table);
        return tables.find(t => t.ident.schema === ident.schema && t.ident.table === ident.table) || null;
    }
    async showCreateTable(ident) {
        const qn = `${quoteIdent(ident.schema)}.${quoteIdent(ident.table)}`;
        const { rows } = await this.#client.query(`SHOW CREATE TABLE ${qn}`);
        const first = rows[0];
        return first ? (first['Create Table'] || first['CREATE TABLE'] || null) : null;
    }
    async tablesForSchemas(schemas, onlyTable) {
        const schemaList = schemas.map(s => sqlString(s)).join(',');
        const tableFilter = onlyTable ? `AND t.TABLE_NAME = ${sqlString(onlyTable)}` : '';
        const { rows: trows } = await this.#client.query(`
      SELECT t.TABLE_SCHEMA, t.TABLE_NAME, t.TABLE_COMMENT
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE t.TABLE_SCHEMA IN (${schemaList}) AND t.TABLE_TYPE='BASE TABLE' ${tableFilter}
      ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME
    `);
        const out = [];
        for (const t of trows) {
            const ident = { schema: t.TABLE_SCHEMA, table: t.TABLE_NAME };
            const cols = await this.columnsFor(ident);
            const pk = await this.primaryKeyFor(ident);
            const fks = await this.foreignKeysFor(ident);
            const idx = await this.indexesFor(ident);
            const checks = [];
            out.push({ ident, columns: cols, primaryKey: pk, foreignKeys: fks, indexes: idx, checks, comment: t.TABLE_COMMENT || null });
        }
        return out;
    }
    async columnsFor(ident) {
        const { rows } = await this.#client.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH AS LEN,
             NUMERIC_PRECISION AS PREC, NUMERIC_SCALE AS SCALE, COLUMN_KEY, EXTRA, COLUMN_COMMENT, ORDINAL_POSITION, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA=? AND TABLE_NAME=?
      ORDER BY ORDINAL_POSITION
    `, [ident.schema, ident.table]);
        return rows.map((r) => ({
            name: r.COLUMN_NAME,
            dataType: String(r.DATA_TYPE).toUpperCase(),
            nullable: r.IS_NULLABLE === 'YES' ? 'nullable' : 'not_null',
            defaultExpr: r.COLUMN_DEFAULT !== null ? String(r.COLUMN_DEFAULT) : null,
            length: r.LEN != null ? Number(r.LEN) : null,
            precision: r.PREC != null ? Number(r.PREC) : null,
            scale: r.SCALE != null ? Number(r.SCALE) : null,
            isPrimaryKey: r.COLUMN_KEY === 'PRI',
            isUnique: r.COLUMN_KEY === 'UNI',
            isAutoIncrement: String(r.EXTRA || '').includes('auto_increment'),
            isUnsigned: /unsigned/i.test(r.COLUMN_TYPE || ''),
            ordinalPosition: Number(r.ORDINAL_POSITION),
            comment: r.COLUMN_COMMENT || null
        }));
    }
    async primaryKeyFor(ident) {
        const { rows } = await this.#client.query(`
      SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
        ON tc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       AND tc.TABLE_SCHEMA = k.TABLE_SCHEMA
       AND tc.TABLE_NAME = k.TABLE_NAME
      WHERE tc.TABLE_SCHEMA=? AND tc.TABLE_NAME=? AND tc.CONSTRAINT_TYPE='PRIMARY KEY'
      ORDER BY k.ORDINAL_POSITION
    `, [ident.schema, ident.table]);
        if (!rows.length)
            return null;
        return { name: rows[0].CONSTRAINT_NAME, columns: rows.map((r) => r.COLUMN_NAME) };
    }
    async foreignKeysFor(ident) {
        const { rows } = await this.#client.query(`
      SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
             rc.UPDATE_RULE, rc.DELETE_RULE
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
      JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
        ON rc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       AND rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
      WHERE k.TABLE_SCHEMA=? AND k.TABLE_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY k.CONSTRAINT_NAME, k.POSITION_IN_UNIQUE_CONSTRAINT
    `, [ident.schema, ident.table]);
        const grouped = new Map();
        for (const r of rows) {
            const name = r.CONSTRAINT_NAME;
            const cur = grouped.get(name) || {
                name,
                columns: [],
                refSchema: { schema: r.REFERENCED_TABLE_SCHEMA },
                refTable: r.REFERENCED_TABLE_NAME,
                refColumns: [],
                onUpdate: this.mapRule(r.UPDATE_RULE),
                onDelete: this.mapRule(r.DELETE_RULE)
            };
            cur.columns.push(r.COLUMN_NAME);
            cur.refColumns.push(r.REFERENCED_COLUMN_NAME);
            grouped.set(name, cur);
        }
        return [...grouped.values()];
    }
    mapRule(rule) {
        switch ((rule || '').toUpperCase()) {
            case 'CASCADE': return 'cascade';
            case 'SET NULL': return 'set_null';
            case 'RESTRICT': return 'restrict';
            case 'NO ACTION': return 'no_action';
            default: return 'no_action';
        }
    }
    async indexesFor(ident) {
        const { rows } = await this.#client.query(`SHOW INDEX FROM ${quoteIdent(ident.schema)}.${quoteIdent(ident.table)}`);
        const grouped = new Map();
        for (const r of rows) {
            const name = r.Key_name;
            if (name === 'PRIMARY')
                continue;
            const g = grouped.get(name) || { name, columns: [], unique: r.Non_unique === 0 };
            g.columns.push(r.Column_name);
            grouped.set(name, g);
        }
        return [...grouped.values()];
    }
}
/* Provider */
export const mysqlProvider = {
    dialect: 'mysql',
    capabilities: mysqlCapabilities,
    async connect(config) {
        try {
            const cfg = typeof config === 'string' || config instanceof URL ? parseUrlConfig(String(config)) : config;
            const pool = mysql.createPool({
                host: cfg.host,
                port: Number(cfg.port ?? 3306),
                user: cfg.user,
                password: cfg.password,
                database: cfg.database,
                waitForConnections: true,
                connectionLimit: Number(cfg.connectionLimit ?? 10),
                multipleStatements: false,
                supportBigNumbers: true,
                bigNumberStrings: false,
                dateStrings: false
            });
            return new MySQLClient(pool);
        }
        catch (e) {
            throw new SQLError(`MySQL connect error: ${e?.message || e}`, { dialect: 'mysql', cause: e });
        }
    },
    createIntrospector(client) { return new MySQLIntrospector(client); },
    builders: { ddl: new MySQLDDL(), dml: new MySQLDML(), dcl: new MySQLDCL(), tcl: new MySQLTCL() }
};
function parseUrlConfig(url) {
    try {
        const u = new URL(url);
        return {
            host: u.hostname,
            port: u.port ? Number(u.port) : 3306,
            user: decodeURIComponent(u.username || 'root'),
            password: u.password ? decodeURIComponent(u.password) : '',
            database: u.pathname ? u.pathname.replace(/^\//, '') : undefined,
            ssl: u.searchParams.get('ssl') === 'true'
        };
    }
    catch {
        return { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: undefined };
    }
}
