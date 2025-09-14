import { registerProvider, connectAndDetect } from '@nublox/sqlx';
import { mysqlProvider } from '@nublox/sqlx'; // auto-registered in sqlx/index, but safe to import

export type DB = {
  client: import('@nublox/sqlx').SQLClient;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  exec(sql: string, params?: any[]): Promise<{ affectedRows: number; lastInsertId: number | string | null }>;
  tx<T>(fn: (db: DB) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};

export async function createDB(url = process.env.DATABASE_URL || 'mysql://root:root@127.0.0.1:3306/nublox'): Promise<DB> {
  // Ensure MySQL provider is registered (no-op if already)
  registerProvider(mysqlProvider);

  const { client } = await connectAndDetect(url);
  const query = async <T = any>(sql: string, params: any[] = []) => (await client.query<T>(sql, params)).rows;
  const exec = async (sql: string, params: any[] = []) => client.exec(sql, params);
  const tx = async <T>(fn: (txdb: DB) => Promise<T>): Promise<T> =>
    client.transaction(async (txc) => {
      const sub: DB = {
        client: txc as any,
        query: async <U = any>(s: string, p: any[] = []) => (await txc.query<U>(s, p)).rows,
        exec: (s: string, p: any[] = []) => txc.exec(s, p),
        tx: async f => f(sub),
        close: async () => { }
      };
      return fn(sub);
    });
  const close = async () => client.close();
  return { client, query, exec, tx, close };
}
