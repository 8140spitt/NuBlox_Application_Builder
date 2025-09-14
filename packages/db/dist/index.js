import { registerProvider, connectAndDetect } from '@nublox/sqlx';
import { mysqlProvider } from '@nublox/sqlx'; // auto-registered in sqlx/index, but safe to import
export async function createDB(url = process.env.DATABASE_URL || 'mysql://root:root@127.0.0.1:3306/nublox') {
    // Ensure MySQL provider is registered (no-op if already)
    registerProvider(mysqlProvider);
    const { client } = await connectAndDetect(url);
    const query = async (sql, params = []) => (await client.query(sql, params)).rows;
    const exec = async (sql, params = []) => client.exec(sql, params);
    const tx = async (fn) => client.transaction(async (txc) => {
        const sub = {
            client: txc,
            query: async (s, p = []) => (await txc.query(s, p)).rows,
            exec: (s, p = []) => txc.exec(s, p),
            tx: async (f) => f(sub),
            close: async () => { }
        };
        return fn(sub);
    });
    const close = async () => client.close();
    return { client, query, exec, tx, close };
}
