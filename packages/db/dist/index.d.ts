export type DB = {
    client: import('@nublox/sqlx').SQLClient;
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    exec(sql: string, params?: any[]): Promise<{
        affectedRows: number;
        lastInsertId: number | string | null;
    }>;
    tx<T>(fn: (db: DB) => Promise<T>): Promise<T>;
    close(): Promise<void>;
};
export declare function createDB(url?: string): Promise<DB>;
