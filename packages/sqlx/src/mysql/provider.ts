/*
 * NuBlox SQLX — MySQL Provider (v0.1) — patched typings for Pool/PoolConnection
 */

import mysql from 'mysql2/promise';
import type {
  SQLClient, SQLParams, RowObject, QueryOptions, QueryResult, ExecResult,
  SQLTransaction, PreparedStatement, SQLDialect, DialectProvider,
  CapabilityMatrix, DialectIntrospector, SchemaSnapshot, TableIdent, TableDef,
  SchemaIdent, ColumnDef, IndexDef, CheckDef, ForeignKeyDef, ViewDef,
  DDLBuilder, DMLBuilder, DCLBuilder, TCLBuilder, IsolationLevel, AlterTableCommand
} from '../core/types.js';
import { SQLError } from '../core/types.js';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket, FieldPacket, PreparedStatementInfo } from 'mysql2/promise';

/* Narrow helper casts to satisfy TS when mysql2 types differ by version */
type ConnOps = {
  query: (sql: string, params?: any[]) => Promise<[any, FieldPacket[]]>;
  execute: (sql: string, params?: any[]) => Promise<[any, FieldPacket[]]>;
  prepare: (sql: string) => Promise<PreparedStatementInfo>;
  release: () => void;
};
type PoolOps = {
  query: (sql: string, params?: any[]) => Promise<[any, FieldPacket[]]>;
  execute: (sql: string, params?: any[]) => Promise<[any, FieldPacket[]]>;
  getConnection: () => Promise<PoolConnection>;
  end: () => Promise<void>;
};
const asConn = (c: PoolConnection) => c as unknown as ConnOps;
const asPool = (p: Pool) => p as unknown as PoolOps;

/* Capabilities (conservative base; runtime refined in client.capabilities()) */
export const mysqlCapabilities: CapabilityMatrix = {
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
    ctes: false,            // refined to true on 8.0+
    windowFunctions: false  // refined to true on 8.0+
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
    jsonNative: false,      // refined to true on 5.7+
    fullTextSearch: true,
    generatedColumns: false // refined to true on 5.7+
  }
};

/* Utils */
function nowMs() { return performance.now(); }
function quoteIdent(name: string): string {
  if (name.includes('`')) return '`' + name.replace(/`/g, '``') + '`';
  return '`' + name + '`';
}
function renderQualified(ident: { schema: string; table?: string }) {
  if ('table' in ident && ident.table) {
    return `${quoteIdent(ident.schema)}.${quoteIdent(ident.table)}`;
  }
  return `${quoteIdent(ident.schema)}`;
}
function sqlString(s: string): string { return `'${String(s).replace(/'/g, "''")}'`; }
function mapIsolation(lvl: IsolationLevel): string {
  switch (lvl) {
    case 'read_uncommitted': return 'READ UNCOMMITTED';
    case 'read_committed': return 'READ COMMITTED';
    case 'repeatable_read': return 'REPEATABLE READ';
    case 'serializable': return 'SERIALIZABLE';
    default: return 'REPEATABLE READ';
  }
}
function sqlLiteral(v: any): string {
  if (v === null || v === undefined) return 'NULL';
  if (v instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = v.getFullYear();
    const m = pad(v.getMonth() + 1);
    const d = pad(v.getDate());
    const hh = pad(v.getHours());
    const mm = pad(v.getMinutes());
    const ss = pad(v.getSeconds());
    return `'${y}-${m}-${d} ${hh}:${mm}:${ss}'`;
  }
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  return `'${String(v).replace(/'/g, "''")}'`;
}

/* Prepared Statement */
class MySQLPrepared implements PreparedStatement {
  readonly dialect: SQLDialect = 'mysql';
  #stmt: PreparedStatementInfo;
  constructor(stmt: PreparedStatementInfo) { this.#stmt = stmt; }

  async query<T = RowObject>(params: SQLParams = [], options?: QueryOptions): Promise<QueryResult<T>> {
    const t0 = nowMs();
    const [rows, fields] = await this.#stmt.execute(params) as [RowDataPacket[] | RowDataPacket[][], FieldPacket[]];
    return {
      rows: rows as unknown as T[],
      rowCount: Array.isArray(rows) ? (rows as any[]).length : 0,
      fields: fields?.map((f) => ({ name: f.name, type: String(f.columnType), nullable: true })) ?? undefined,
      executionMs: options?.trace ? (nowMs() - t0) : undefined
    };
  }
  async exec(params: SQLParams = [], options?: QueryOptions): Promise<ExecResult> {
    const t0 = nowMs();
    const [res] = await this.#stmt.execute(params);
    const ok = res as ResultSetHeader;
    return { affectedRows: ok.affectedRows ?? 0, lastInsertId: ok.insertId ?? null, executionMs: options?.trace ? (nowMs() - t0) : undefined };
  }
  async close(): Promise<void> { try { await this.#stmt.close(); } catch { } }
}

/* Transaction */
class MySQLTx implements SQLTransaction {
  readonly dialect: SQLDialect = 'mysql';
  #conn: PoolConnection;
  constructor(conn: PoolConnection) { this.#conn = conn; }

  async query<T = RowObject>(sql: string, params: SQLParams = [], options?: QueryOptions): Promise<QueryResult<T>> {
    const t0 = nowMs();
    const [rows, fields] = await asConn(this.#conn).query(sql, params);
    return {
      rows: rows as T[],
      rowCount: Array.isArray(rows) ? (rows as any[]).length : 0,
      fields: (fields as FieldPacket[] | undefined)?.map((f) => ({ name: f.name, type: String(f.columnType), nullable: true })) ?? undefined,
      executionMs: options?.trace ? (nowMs() - t0) : undefined
    };
  }
  async exec(sql: string, params: SQLParams = [], options?: QueryOptions): Promise<ExecResult> {
    const t0 = nowMs();
    const [res] = await asConn(this.#conn).execute(sql, params);
    const ok = res as ResultSetHeader;
    return { affectedRows: ok.affectedRows ?? 0, lastInsertId: ok.insertId ?? null, executionMs: options?.trace ? (nowMs() - t0) : undefined };
  }
  async prepare(sql: string): Promise<PreparedStatement> {
    const stmt = await asConn(this.#conn).prepare(sql);
    return new MySQLPrepared(stmt);
  }
  async *stream<T = RowObject>(sql: string, params: SQLParams = [], options?: QueryOptions): AsyncIterable<T> {
    const chunk = Math.max(1000, options?.maxRows ?? 1000);
    let offset = 0;
    while (true) {
      const pagedSQL = `${sql} LIMIT ${chunk} OFFSET ${offset}`;
      const { rows } = await this.query<T>(pagedSQL, params, options);
      if (!rows.length) break;
      for (const r of rows) yield r;
      offset += rows.length;
      if (rows.length < chunk) break;
    }
  }
  async savepoint(name: string = 'sp_' + Date.now()): Promise<void> { await asConn(this.#conn).query(`SAVEPOINT ${quoteIdent(name)}`); }
  async rollback(name?: string): Promise<void> { if (name) await asConn(this.#conn).query(`ROLLBACK TO SAVEPOINT ${quoteIdent(name)}`); else await asConn(this.#conn).query('ROLLBACK'); }
  async release(name: string = 'sp'): Promise<void> { await asConn(this.#conn).query(`RELEASE SAVEPOINT ${quoteIdent(name)}`); }
  async commit(): Promise<void> { await asConn(this.#conn).query('COMMIT'); }
}

/* Client */
class MySQLClient implements SQLClient {
  readonly dialect: SQLDialect = 'mysql';
  #pool: Pool;
  #caps?: CapabilityMatrix;

  constructor(pool: Pool) { this.#pool = pool; }

  async query<T = RowObject>(sql: string, params: SQLParams = [], options?: QueryOptions): Promise<QueryResult<T>> {
    const t0 = nowMs();
    const [rows, fields] = await asPool(this.#pool).query(sql, params);
    return {
      rows: rows as T[],
      rowCount: Array.isArray(rows) ? (rows as any[]).length : 0,
      fields: (fields as FieldPacket[] | undefined)?.map((f) => ({ name: f.name, type: String(f.columnType), nullable: true })) ?? undefined,
      executionMs: options?.trace ? (nowMs() - t0) : undefined
    };
  }
  async exec(sql: string, params: SQLParams = [], options?: QueryOptions): Promise<ExecResult> {
    const t0 = nowMs();
    const [res] = await asPool(this.#pool).execute(sql, params);
    const ok = res as ResultSetHeader;
    return { affectedRows: ok.affectedRows ?? 0, lastInsertId: ok.insertId ?? null, executionMs: options?.trace ? (nowMs() - t0) : undefined };
  }
  async begin(options?: { isolation?: IsolationLevel }): Promise<SQLTransaction> {
    const conn = await asPool(this.#pool).getConnection();
    try {
      if (options?.isolation) await asConn(conn).query(`SET TRANSACTION ISOLATION LEVEL ${mapIsolation(options.isolation)}`);
      await asConn(conn).query('START TRANSACTION');
      return new MySQLTx(conn);
    } catch (e) {
      asConn(conn).release();
      throw e;
    }
  }
  async transaction<T>(fn: (tx: SQLTransaction) => Promise<T>, options?: { isolation?: IsolationLevel }): Promise<T> {
    const conn = await asPool(this.#pool).getConnection();
    try {
      if (options?.isolation) await asConn(conn).query(`SET TRANSACTION ISOLATION LEVEL ${mapIsolation(options.isolation)}`);
      await asConn(conn).query('START TRANSACTION');
      const tx = new MySQLTx(conn);
      const out = await fn(tx);
      await asConn(conn).query('COMMIT');
      return out;
    } catch (e) {
      try { await asConn(conn).query('ROLLBACK'); } catch { }
      throw e;
    } finally {
      asConn(conn).release();
    }
  }
  async prepare(sql: string): Promise<PreparedStatement> {
    const conn = await asPool(this.#pool).getConnection();
    const stmt = await asConn(conn).prepare(sql);
    return new MySQLPrepared(stmt);
  }
  async *stream<T = RowObject>(sql: string, params: SQLParams = [], options?: QueryOptions): AsyncIterable<T> {
    const chunk = Math.max(1000, options?.maxRows ?? 1000);
    let offset = 0;
    while (true) {
      const pagedSQL = `${sql} LIMIT ${chunk} OFFSET ${offset}`;
      const { rows } = await this.query<T>(pagedSQL, params, options);
      if (!rows.length) break;
      for (const r of rows) yield r;
      offset += rows.length;
      if (rows.length < chunk) break;
    }
  }
  async close(): Promise<void> { await asPool(this.#pool).end(); }

  async capabilities(): Promise<CapabilityMatrix> {
    if (this.#caps) return this.#caps;
    try {
      const [rows] = await asPool(this.#pool).query(
        "SELECT @@version AS v, @@version_comment AS c, @@character_set_server AS cs"
      );
      const info: any = Array.isArray(rows) ? rows[0] : rows;
      const vstr = String(info?.v ?? '8.0.0');
      const m = vstr.match(/^(\d+)\.(\d+)\.(\d+)/);
      const major = m ? parseInt(m[1], 10) : 8;
      const minor = m ? parseInt(m[2], 10) : 0;
      const patch = m ? parseInt(m[3], 10) : 0;
      const atLeast = (M: number, m: number, p = 0) =>
        major > M || (major === M && (minor > m || (minor === m && patch >= p)));

      const caps: CapabilityMatrix = JSON.parse(JSON.stringify(mysqlCapabilities));
      caps.dml.ctes = atLeast(8, 0);
      caps.dml.windowFunctions = atLeast(8, 0);
      caps.misc.jsonNative = atLeast(5, 7);
      caps.misc.generatedColumns = atLeast(5, 7);
      (caps.misc as any).checkConstraintsEnforced = atLeast(8, 0, 16);

      this.#caps = caps;
    } catch {
      this.#caps = mysqlCapabilities;
    }
    return this.#caps!;
  }
}

/* Builders */
class MySQLDDL implements DDLBuilder {
  quoteIdent = quoteIdent;

  createTable(ident: TableIdent, def: TableDef, opts = {}): string {
    const qname = renderQualified(ident);
    const cols: string[] = def.columns.map(c => {
      const parts = [quoteIdent(c.name), this.renderColumnType(c)];
      if (c.isUnsigned) parts.push('UNSIGNED');
      if (c.isAutoIncrement) parts.push('AUTO_INCREMENT');
      if (c.nullable === 'not_null') parts.push('NOT NULL'); else parts.push('NULL');

      // Computed (generated) columns
      if (c.computedExpr) {
        parts.push(`AS (${c.computedExpr}) ${c.computedStored ? 'STORED' : 'VIRTUAL'}`);
      } else {
        // Defaults: prefer param-safe defaultValue, else raw defaultExpr
        if (c.defaultExpr != null) {
          parts.push(`DEFAULT ${c.defaultExpr}`);
        } else if (c.defaultValue !== undefined) {
          parts.push(`DEFAULT ${sqlLiteral(c.defaultValue)}`);
        }
      }

      if (c.comment) parts.push(`COMMENT ${sqlString(c.comment)}`);

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
      for (const ck of def.checks) cols.push(`CONSTRAINT ${quoteIdent(ck.name)} CHECK (${ck.expression})`);
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

    const ifne = (opts as any).ifNotExists ? 'IF NOT EXISTS ' : '';
    const tableComment = (opts as any).tableComment != null
      ? ` COMMENT=${sqlString(String((opts as any).tableComment))}`
      : '';
    const engine = (opts as any).engine
      ? ` ENGINE=${String((opts as any).engine)}`
      : ' ENGINE=InnoDB';
    const charset = (opts as any).charset ?? 'utf8mb4';
    const collate = (opts as any).collate ?? 'utf8mb4_0900_ai_ci';

    return `CREATE TABLE ${ifne}${qname} (\n  ${cols.join(',\n  ')}\n)${engine}${tableComment} DEFAULT CHARSET=${charset} COLLATE=${collate};`;
  }

  alterTable(ident: TableIdent, cmd: AlterTableCommand): string[] {
    const qname = renderQualified(ident);
    const statements: string[] = [];

    if (cmd.addColumns?.length) {
      for (const c of cmd.addColumns) {
        const def = [quoteIdent(c.name), this.renderColumnType(c)];
        if (c.isUnsigned) def.push('UNSIGNED');
        if (c.isAutoIncrement) def.push('AUTO_INCREMENT');
        if (c.nullable === 'not_null') def.push('NOT NULL'); else def.push('NULL');

        if (c.computedExpr) {
          def.push(`AS (${c.computedExpr}) ${c.computedStored ? 'STORED' : 'VIRTUAL'}`);
        } else {
          if (c.defaultExpr != null) def.push(`DEFAULT ${c.defaultExpr}`);
          else if (c.defaultValue !== undefined) def.push(`DEFAULT ${sqlLiteral(c.defaultValue)}`);
        }

        if (c.comment) def.push(`COMMENT ${sqlString(c.comment)}`);

        statements.push(`ALTER TABLE ${qname} ADD COLUMN ${def.join(' ')};`);
      }
    }
    if (cmd.dropColumns?.length) {
      for (const col of cmd.dropColumns) statements.push(`ALTER TABLE ${qname} DROP COLUMN ${quoteIdent(col)};`);
    }
    if (cmd.alterColumns?.length) {
      for (const ac of cmd.alterColumns) {
        if (ac.oldName && ac.name && ac.oldName !== ac.name) {
          statements.push(`ALTER TABLE ${qname} CHANGE COLUMN ${quoteIdent(ac.oldName)} ${quoteIdent(ac.name)} ${this.renderColumnType(ac as ColumnDef)};`);
        } else if (ac.name) {
          statements.push(`ALTER TABLE ${qname} MODIFY COLUMN ${quoteIdent(ac.name)} ${this.renderColumnType(ac as ColumnDef)};`);
        } else {
          throw new SQLError('MySQLDDL.alterTable: alterColumns entry must include name (and oldName if renaming).', { dialect: 'mysql' });
        }
      }
    }
    if (cmd.setPrimaryKey !== undefined) {
      if (cmd.setPrimaryKey === null) statements.push(`ALTER TABLE ${qname} DROP PRIMARY KEY;`);
      else statements.push(`ALTER TABLE ${qname} ADD PRIMARY KEY (${cmd.setPrimaryKey.columns.map(quoteIdent).join(', ')});`);
    }
    if (cmd.addIndexes?.length) for (const idx of cmd.addIndexes) statements.push(this.createIndex(ident, idx));
    if (cmd.dropIndexes?.length) for (const name of cmd.dropIndexes) statements.push(this.dropIndex(ident, name));
    if (cmd.addChecks?.length) for (const ck of cmd.addChecks) statements.push(`ALTER TABLE ${qname} ADD CONSTRAINT ${quoteIdent(ck.name)} CHECK (${ck.expression});`);
    if (cmd.dropChecks?.length) for (const name of cmd.dropChecks) statements.push(`ALTER TABLE ${qname} DROP CHECK ${quoteIdent(name)};`);
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
    if (cmd.dropForeignKeys?.length) for (const name of cmd.dropForeignKeys) statements.push(`ALTER TABLE ${qname} DROP FOREIGN KEY ${quoteIdent(name)};`);
    if (cmd.setComment !== undefined) {
      if (cmd.setComment === null) statements.push(`ALTER TABLE ${qname} COMMENT='' ;`);
      else statements.push(`ALTER TABLE ${qname} COMMENT=${sqlString(cmd.setComment)};`);
    }
    return statements;
  }

  dropTable(ident: TableIdent, ifExists = true): string {
    const qname = renderQualified(ident);
    return `DROP TABLE ${ifExists ? 'IF EXISTS ' : ''}${qname};`;
  }
  createIndex(ident: TableIdent, idx: IndexDef, ifNotExists = false): string {
    const qname = renderQualified(ident);
    const kind = idx.unique ? 'UNIQUE' : 'INDEX';
    const ifne = ifNotExists ? 'IF NOT EXISTS ' : '';
    return `CREATE ${kind} ${ifne}${quoteIdent(idx.name)} ON ${qname} (${idx.columns.map(quoteIdent).join(', ')});`;
  }
  dropIndex(ident: TableIdent, name: string, ifExists = true): string {
    const qname = renderQualified(ident);
    const exists = ifExists ? 'IF EXISTS ' : '';
    return `DROP INDEX ${exists}${quoteIdent(name)} ON ${qname};`;
  }
  createView(schema: SchemaIdent, view: ViewDef, orReplace = false): string {
    const qname = `${quoteIdent(schema.schema)}.${quoteIdent(view.name)}`;
    const rep = orReplace ? 'OR REPLACE ' : '';
    return `CREATE ${rep}VIEW ${qname} AS ${view.definitionSQL};`;
  }
  dropView(schema: SchemaIdent, name: string, ifExists = true): string {
    const qname = `${quoteIdent(schema.schema)}.${quoteIdent(name)}`;
    return `DROP VIEW ${ifExists ? 'IF EXISTS ' : ''}${qname};`;
  }
  private renderColumnType(c: ColumnDef): string {
    const dt = c.dataType.toUpperCase();
    if (/^(VARCHAR|CHAR|BINARY|VARBINARY)$/.test(dt) && c.length) return `${dt}(${c.length})`;
    if (/^(DECIMAL|NUMERIC)$/.test(dt) && c.precision != null) {
      const scale = c.scale != null ? `,${c.scale}` : '';
      return `${dt}(${c.precision}${scale})`;
    }
    if (/^(ENUM|SET)$/.test(dt) && c.comment) return `${dt}(${c.comment})`;
    return dt;
  }
  private mapFKAction(a: NonNullable<ForeignKeyDef['onUpdate'] | ForeignKeyDef['onDelete']>): string {
    switch (a) {
      case 'no_action': return 'NO ACTION';
      case 'restrict': return 'RESTRICT';
      case 'cascade': return 'CASCADE';
      case 'set_null': return 'SET NULL';
      case 'set_default': return 'SET DEFAULT';
    }
  }
}

class MySQLDML implements DMLBuilder {
  upsert(ident: TableIdent, row: RowObject, conflictKeys: string[], _returning?: string[]): string {
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

class MySQLDCL implements DCLBuilder {
  createUser(username: string, options?: Record<string, unknown>): string {
    const host = (options as any)?.host ?? '%';
    const identified = (options as any)?.identifiedBy ? ` IDENTIFIED BY ${sqlString(String((options as any).identifiedBy))}` : '';
    return `CREATE USER ${sqlString(username)}@${sqlString(host)}${identified};`;
  }
  dropUser(username: string, ifExists = true): string {
    return `DROP USER ${ifExists ? 'IF EXISTS ' : ''}${sqlString(username)}@${sqlString('%')};`;
  }
  createRole(role: string): string { return `CREATE ROLE ${quoteIdent(role)};`; }
  dropRole(role: string, ifExists = true): string { return `DROP ROLE ${ifExists ? 'IF EXISTS ' : ''}${quoteIdent(role)};`; }
  grant(priv: string, on: { table?: TableIdent; schema?: SchemaIdent; database?: string }, to: string): string {
    let target = '*.*';
    if (on.table) target = `${quoteIdent(on.table.schema)}.${quoteIdent(on.table.table)}`;
    else if (on.schema) target = `${quoteIdent(on.schema.schema)}.*`;
    else if (on.database) target = `${quoteIdent(on.database)}.*`;
    return `GRANT ${priv} ON ${target} TO ${to};`;
  }
  revoke(priv: string, on: { table?: TableIdent; schema?: SchemaIdent; database?: string }, from: string): string {
    let target = '*.*';
    if (on.table) target = `${quoteIdent(on.table.schema)}.${quoteIdent(on.table.table)}`;
    else if (on.schema) target = `${quoteIdent(on.schema.schema)}.*`;
    else if (on.database) target = `${quoteIdent(on.database)}.*`;
    return `REVOKE ${priv} ON ${target} FROM ${from};`;
  }
}

class MySQLTCL implements TCLBuilder {
  begin(): string { return 'START TRANSACTION'; }
  commit(): string { return 'COMMIT'; }
  rollback(): string { return 'ROLLBACK'; }
  savepoint(name: string): string { return `SAVEPOINT ${quoteIdent(name)}`; }
  rollbackTo(name: string): string { return `ROLLBACK TO SAVEPOINT ${quoteIdent(name)}`; }
  releaseSavepoint(name: string): string { return `RELEASE SAVEPOINT ${quoteIdent(name)}`; }
  setIsolation(lvl: IsolationLevel): string { return `SET TRANSACTION ISOLATION LEVEL ${mapIsolation(lvl)}`; }
}

/* Introspector */
class MySQLIntrospector implements DialectIntrospector {
  #client: SQLClient;
  constructor(client: SQLClient) { this.#client = client; }

  async snapshot(schemas?: string[]): Promise<SchemaSnapshot> {
    const filter = schemas && schemas.length ? `AND SCHEMA_NAME IN (${schemas.map(s => sqlString(s)).join(',')})` : '';
    const schemaRows = await this.#client.query<{ schema_name: string }>(
      `SELECT SCHEMA_NAME AS schema_name FROM INFORMATION_SCHEMA.SCHEMATA WHERE 1=1 ${filter} ORDER BY SCHEMA_NAME`
    );
    const schemasList: SchemaIdent[] = schemaRows.rows.map(r => ({ schema: r.schema_name }));

    const tables = await this.tablesForSchemas(schemasList.map(s => s.schema));
    return { dialect: 'mysql', capturedAt: new Date(), schemas: schemasList, tables };
  }

  async table(ident: TableIdent): Promise<TableDef | null> {
    const tables = await this.tablesForSchemas([ident.schema], ident.table);
    return tables.find(t => t.ident.schema === ident.schema && t.ident.table === ident.table) || null;
  }

  async showCreateTable(ident: TableIdent): Promise<string | null> {
    const qn = `${quoteIdent(ident.schema)}.${quoteIdent(ident.table)}`;
    const { rows } = await this.#client.query<any>(`SHOW CREATE TABLE ${qn}`);
    const first = rows[0] as any;
    return first ? (first['Create Table'] || first['CREATE TABLE'] || null) : null;
  }

  private async tablesForSchemas(schemas: string[], onlyTable?: string): Promise<TableDef[]> {
    const schemaList = schemas.map(s => sqlString(s)).join(',');
    const tableFilter = onlyTable ? `AND t.TABLE_NAME = ${sqlString(onlyTable)}` : '';
    const { rows: trows } = await this.#client.query<any>(`
      SELECT t.TABLE_SCHEMA, t.TABLE_NAME, t.TABLE_COMMENT
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE t.TABLE_SCHEMA IN (${schemaList}) AND t.TABLE_TYPE='BASE TABLE' ${tableFilter}
      ORDER BY t.TABLE_SCHEMA, t.TABLE_NAME
    `);

    const out: TableDef[] = [];
    for (const t of trows) {
      const ident: TableIdent = { schema: t.TABLE_SCHEMA, table: t.TABLE_NAME };
      const cols = await this.columnsFor(ident);
      const pk = await this.primaryKeyFor(ident);
      const fks = await this.foreignKeysFor(ident);
      const idx = await this.indexesFor(ident);
      const checks: CheckDef[] = [];
      out.push({ ident, columns: cols, primaryKey: pk, foreignKeys: fks, indexes: idx, checks, comment: t.TABLE_COMMENT || null });
    }
    return out;
  }

  private async columnsFor(ident: TableIdent): Promise<ColumnDef[]> {
    const { rows } = await this.#client.query<any>(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH AS LEN,
             NUMERIC_PRECISION AS PREC, NUMERIC_SCALE AS SCALE, COLUMN_KEY, EXTRA, COLUMN_COMMENT, ORDINAL_POSITION, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA=? AND TABLE_NAME=?
      ORDER BY ORDINAL_POSITION
    `, [ident.schema, ident.table]);

    return rows.map((r: any) => ({
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

  private async primaryKeyFor(ident: TableIdent) {
    const { rows } = await this.#client.query<any>(`
      SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
        ON tc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       AND tc.TABLE_SCHEMA = k.TABLE_SCHEMA
       AND tc.TABLE_NAME = k.TABLE_NAME
      WHERE tc.TABLE_SCHEMA=? AND tc.TABLE_NAME=? AND tc.CONSTRAINT_TYPE='PRIMARY KEY'
      ORDER BY k.ORDINAL_POSITION
    `, [ident.schema, ident.table]);
    if (!rows.length) return null;
    return { name: rows[0].CONSTRAINT_NAME as string, columns: rows.map((r: any) => r.COLUMN_NAME as string) };
  }

  private async foreignKeysFor(ident: TableIdent): Promise<ForeignKeyDef[]> {
    const { rows } = await this.#client.query<any>(`
      SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME,
             rc.UPDATE_RULE, rc.DELETE_RULE
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
      JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
        ON rc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
       AND rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
      WHERE k.TABLE_SCHEMA=? AND k.TABLE_NAME=? AND k.REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY k.CONSTRAINT_NAME, k.POSITION_IN_UNIQUE_CONSTRAINT
    `, [ident.schema, ident.table]);

    const grouped = new Map<string, ForeignKeyDef>();
    for (const r of rows) {
      const name = r.CONSTRAINT_NAME as string;
      const cur = grouped.get(name) || {
        name,
        columns: [],
        refSchema: { schema: r.REFERENCED_TABLE_SCHEMA },
        refTable: r.REFERENCED_TABLE_NAME,
        refColumns: [],
        onUpdate: this.mapRule(r.UPDATE_RULE),
        onDelete: this.mapRule(r.DELETE_RULE)
      } as ForeignKeyDef;
      cur.columns.push(r.COLUMN_NAME);
      cur.refColumns.push(r.REFERENCED_COLUMN_NAME);
      grouped.set(name, cur);
    }
    return [...grouped.values()];
  }

  private mapRule(rule: string): ForeignKeyDef['onUpdate'] {
    switch ((rule || '').toUpperCase()) {
      case 'CASCADE': return 'cascade';
      case 'SET NULL': return 'set_null';
      case 'RESTRICT': return 'restrict';
      case 'NO ACTION': return 'no_action';
      default: return 'no_action';
    }
  }

  private async indexesFor(ident: TableIdent): Promise<IndexDef[]> {
    const { rows } = await this.#client.query<any>(`SHOW INDEX FROM ${quoteIdent(ident.schema)}.${quoteIdent(ident.table)}`);
    const grouped = new Map<string, IndexDef>();
    for (const r of rows) {
      const name = r.Key_name as string;
      if (name === 'PRIMARY') continue;
      const g = grouped.get(name) || { name, columns: [], unique: r.Non_unique === 0 };
      (g as any).columns.push(r.Column_name);
      grouped.set(name, g as IndexDef);
    }
    return [...grouped.values()];
  }
}

/* Provider */
export const mysqlProvider: DialectProvider = {
  dialect: 'mysql',
  capabilities: mysqlCapabilities,

  async connect(config: URL | string | Record<string, any>): Promise<SQLClient> {
    try {
      const cfg = typeof config === 'string' || config instanceof URL ? parseUrlConfig(String(config)) : (config as any);
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
    } catch (e: any) {
      throw new SQLError(`MySQL connect error: ${e?.message || e}`, { dialect: 'mysql', cause: e });
    }
  },

  createIntrospector(client: SQLClient): DialectIntrospector { return new MySQLIntrospector(client); },

  builders: { ddl: new MySQLDDL(), dml: new MySQLDML(), dcl: new MySQLDCL(), tcl: new MySQLTCL() }
};

function parseUrlConfig(url: string) {
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
  } catch {
    return { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: undefined };
  }
}
