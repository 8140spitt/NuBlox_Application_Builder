import mysql, { type PoolConnection, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
/** Expose the underlying pool if you need lower-level access */
export declare const createDB: (env?: NodeJS.ProcessEnv) => {
    pool: mysql.Pool;
    query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
    exec: (sql: string, params?: any[]) => Promise<ResultSetHeader>;
    tx: <T>(fn: (conn: PoolConnection) => Promise<T>) => Promise<T>;
};
/** Re-export mysql2 types so app code can import from @nublox/db */
export type { PoolConnection, RowDataPacket, ResultSetHeader };
