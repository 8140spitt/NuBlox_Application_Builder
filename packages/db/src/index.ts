import mysql, {
  type Pool,
  type PoolConnection,
  type RowDataPacket,
  type ResultSetHeader
} from 'mysql2/promise';


/** Expose the underlying pool if you need lower-level access */
export const createDB = (env = process.env) => {
  const pool: Pool = mysql.createPool({
    host: env.DB_HOST ?? '127.0.0.1',
    port: Number(env.DB_PORT ?? 3306),
    user: env.DB_USER ?? 'root',
    password: env.DB_PASS ?? '',
    database: env.DB_NAME ?? 'nublox_studio',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });

  const query = async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await pool.query(sql, params);
    return rows as T[];
  };

  const exec = async function exec(sql: string, params: any[] = []): Promise<ResultSetHeader> {
    const [res] = await pool.execute<ResultSetHeader>(sql, params);
    return res;
  };

  const tx = async function withTx<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const out = await fn(conn);
      await conn.commit();
      return out;
    } catch (err) {
      try { await conn.rollback(); } catch { }
      throw err;
    } finally {
      conn.release();
    }
  };
  return { pool, query, exec, tx }

}

/** Re-export mysql2 types so app code can import from @nublox/db */
export type { PoolConnection, RowDataPacket, ResultSetHeader };
