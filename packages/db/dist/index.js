import mysql from 'mysql2/promise';
/** Expose the underlying pool if you need lower-level access */
export const createDB = (env = process.env) => {
    const pool = mysql.createPool({
        host: env.DB_HOST ?? '127.0.0.1',
        port: Number(env.DB_PORT ?? 3306),
        user: env.DB_USER ?? 'root',
        password: env.DB_PASS ?? '',
        database: env.DB_NAME ?? 'nublox_studio',
        waitForConnections: true,
        connectionLimit: 10,
        namedPlaceholders: true
    });
    const query = async function query(sql, params = []) {
        const [rows] = await pool.query(sql, params);
        return rows;
    };
    const exec = async function exec(sql, params = []) {
        const [res] = await pool.execute(sql, params);
        return res;
    };
    const tx = async function withTx(fn) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const out = await fn(conn);
            await conn.commit();
            return out;
        }
        catch (err) {
            try {
                await conn.rollback();
            }
            catch { }
            throw err;
        }
        finally {
            conn.release();
        }
    };
    return { pool, query, exec, tx };
};
