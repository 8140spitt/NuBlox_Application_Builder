/**
 * NuBlox SQLX — Core types (v0.1)
 */

export type SQLDialect = 'mysql' | 'postgresql' | 'sqlite' | 'sqlserver' | 'oracle';

export type RowObject = Record<string, any>;

export type SQLValue =
  | string
  | number
  | boolean
  | Date
  | null
  | Uint8Array
  | Buffer;

export type SQLParams = Array<SQLValue | RowObject>;

export interface FieldInfo {
  name: string;
  type: string;
  nullable?: boolean;
  table?: string | null;
  schema?: string | null;
}

export interface QueryOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  trace?: boolean;
  maxRows?: number;
}

export interface QueryResult<T = RowObject> {
  rows: T[];
  rowCount: number;
  fields?: FieldInfo[];
  executionMs?: number;
}

export interface ExecResult {
  affectedRows: number;
  lastInsertId: number | string | null;
  executionMs?: number;
}

export interface PreparedStatement {
  readonly dialect: SQLDialect;
  query<T = RowObject>(params?: SQLParams, options?: QueryOptions): Promise<QueryResult<T>>;
  exec(params?: SQLParams, options?: QueryOptions): Promise<ExecResult>;
  close(): Promise<void>;
}

export type IsolationLevel =
  | 'read_uncommitted'
  | 'read_committed'
  | 'repeatable_read'
  | 'serializable';

export interface SQLTransaction {
  readonly dialect: SQLDialect;
  query<T = RowObject>(sql: string, params?: SQLParams, options?: QueryOptions): Promise<QueryResult<T>>;
  exec(sql: string, params?: SQLParams, options?: QueryOptions): Promise<ExecResult>;
  prepare(sql: string): Promise<PreparedStatement>;
  stream<T = RowObject>(sql: string, params?: SQLParams, options?: QueryOptions): AsyncIterable<T>;
  savepoint(name?: string): Promise<void>;
  rollback(name?: string): Promise<void>;
  release(name?: string): Promise<void>;
  commit(): Promise<void>;
}

export interface SQLClient {
  readonly dialect: SQLDialect;
  query<T = RowObject>(sql: string, params?: SQLParams, options?: QueryOptions): Promise<QueryResult<T>>;
  exec(sql: string, params?: SQLParams, options?: QueryOptions): Promise<ExecResult>;
  begin(options?: { isolation?: IsolationLevel }): Promise<SQLTransaction>;
  transaction<T>(fn: (tx: SQLTransaction) => Promise<T>, options?: { isolation?: IsolationLevel }): Promise<T>;
  prepare(sql: string): Promise<PreparedStatement>;
  stream<T = RowObject>(sql: string, params?: SQLParams, options?: QueryOptions): AsyncIterable<T>;
  capabilities(): Promise<CapabilityMatrix>;
  close(): Promise<void>;
}

// ---------- Schema metadata ----------

export interface SchemaIdent { schema: string; }
export interface TableIdent { schema: string; table: string; }

export interface ColumnDef {
  name: string;
  dataType: string;
  length?: number | null;
  precision?: number | null;
  scale?: number | null;
  defaultExpr?: string | null;
  nullable?: 'nullable' | 'not_null';
  isAutoIncrement?: boolean;
  isUnsigned?: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  ordinalPosition?: number | null;
  comment?: string | null;
  defaultValue?: SQLValue | null;   // param-safe default (numbers, strings, dates, boolean, null)
  computedExpr?: string | null;     // expression for computed/generated columns
  computedStored?: boolean;         // true if computed column is stored (not virtual)
}

export interface PrimaryKey {
  name?: string | null;
  columns: string[];
}

export interface IndexDef {
  name: string;
  columns: string[];
  unique?: boolean;
  where?: string | null;
  using?: string | null;
}

export interface CheckDef {
  name: string;
  expression: string;
}

export type FKAction = 'no_action' | 'restrict' | 'cascade' | 'set_null' | 'set_default';

export interface ForeignKeyDef {
  name?: string | null;
  columns: string[];
  refSchema?: SchemaIdent;
  refTable: string;
  refColumns: string[];
  onUpdate?: FKAction;
  onDelete?: FKAction;
}

export interface ViewDef {
  name: string;
  definitionSQL: string;
}

export interface TableDef {
  ident: TableIdent;
  columns: ColumnDef[];
  primaryKey?: PrimaryKey | null;
  indexes?: IndexDef[];
  foreignKeys?: ForeignKeyDef[];
  checks?: CheckDef[];
  comment?: string | null;
}

export interface SchemaSnapshot {
  dialect: SQLDialect;
  capturedAt: Date;
  schemas: SchemaIdent[];
  tables: TableDef[];
}

// ---------- Builders ----------

export interface DDLBuilder {
  quoteIdent(name: string): string;
  createTable(ident: TableIdent, def: TableDef, opts?: Record<string, any>): string;
  alterTable(ident: TableIdent, cmd: AlterTableCommand): string[];
  dropTable(ident: TableIdent, ifExists?: boolean): string;
  createIndex(ident: TableIdent, idx: IndexDef, ifNotExists?: boolean): string;
  dropIndex(ident: TableIdent, name: string, ifExists?: boolean): string;
  createView(schema: SchemaIdent, view: ViewDef, orReplace?: boolean): string;
  dropView(schema: SchemaIdent, name: string, ifExists?: boolean): string;
}

export interface DMLBuilder {
  upsert(ident: TableIdent, row: RowObject, conflictKeys: string[], returning?: string[]): string;
}

export interface DCLBuilder {
  createUser(username: string, options?: Record<string, unknown>): string;
  dropUser(username: string, ifExists?: boolean): string;
  createRole(role: string): string;
  dropRole(role: string, ifExists?: boolean): string;
  grant(priv: string, on: { table?: TableIdent; schema?: SchemaIdent; database?: string }, to: string): string;
  revoke(priv: string, on: { table?: TableIdent; schema?: SchemaIdent; database?: string }, from: string): string;
}

export interface TCLBuilder {
  begin(): string;
  commit(): string;
  rollback(): string;
  savepoint(name: string): string;
  rollbackTo(name: string): string;
  releaseSavepoint(name: string): string;
  setIsolation(lvl: IsolationLevel): string;
}

export interface AlterTableCommand {
  addColumns?: ColumnDef[];
  dropColumns?: string[];
  alterColumns?: Array<Partial<ColumnDef> & { name?: string; oldName?: string }>;
  setPrimaryKey?: { columns: string[] } | null;
  addIndexes?: IndexDef[];
  dropIndexes?: string[];
  addChecks?: CheckDef[];
  dropChecks?: string[];
  addForeignKeys?: ForeignKeyDef[];
  dropForeignKeys?: string[];
  setComment?: string | null;
}

// ---------- Introspector ----------

export interface DialectIntrospector {
  snapshot(schemas?: string[]): Promise<SchemaSnapshot>;
  table(ident: TableIdent): Promise<TableDef | null>;
  showCreateTable(ident: TableIdent): Promise<string | null>;
}

// ---------- Capabilities ----------

export interface CapabilityMatrix {
  ddl: {
    createTable: boolean;
    alterTable: boolean;
    dropTable: boolean;
    createIndex: boolean;
    alterIndex: boolean;
    dropIndex: boolean;
    createView: boolean;
    triggers: boolean;
    sequences: boolean;
    computedColumns: boolean;
  };
  dml: {
    upsert: 'on_duplicate' | 'on_conflict' | 'merge' | false;
    returning: boolean;
    ctes: boolean;
    windowFunctions: boolean;
  };
  dcl: {
    users: boolean;
    roles: boolean;
    grants: boolean;
    rowLevelSecurity: boolean;
  };
  tcl: {
    savepoints: boolean;
    setIsolation: boolean;
    parallelTransactions: boolean;
  };
  misc: {
    explain: boolean;
    analyze: boolean;
    serverCursors: boolean;
    jsonNative: boolean;
    fullTextSearch: boolean;
    generatedColumns: boolean;
  };
}

// ---------- Provider ----------

export interface DialectProvider {
  dialect: SQLDialect;
  capabilities: CapabilityMatrix;
  connect(config: URL | string | Record<string, any>): Promise<SQLClient>;
  createIntrospector(client: SQLClient): DialectIntrospector;
  builders: {
    ddl: DDLBuilder;
    dml: DMLBuilder;
    dcl: DCLBuilder;
    tcl: TCLBuilder;
  };
}

// ---------- Errors ----------

export class SQLError extends Error {
  code?: string;
  dialect?: SQLDialect;
  cause?: any;
  meta?: Record<string, any>;

  constructor(message: string, info?: { code?: string; dialect?: SQLDialect; cause?: any;[k: string]: any }) {
    super(message);
    this.name = 'SQLError';
    if (info) {
      this.code = info.code;
      this.dialect = info.dialect;
      this.cause = info.cause;
      this.meta = { ...info };
    }
  }
}