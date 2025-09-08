// packages/sqlx/scripts/mysql-smoke.js
import { registerMySQL, connect } from '../dist/index.js';

async function main() {
    registerMySQL();

    // e.g. docker: mysql://root:password@127.0.0.1:3306/sqlx_smoketest
    const url = process.env.SQLX_TEST_URL || 'mysql://root:password@127.0.0.1:3306/sqlx_smoketest';
    const db = await connect(url);

    try {
        await db.exec('CREATE DATABASE IF NOT EXISTS `sqlx_smoketest`');
        await db.exec('USE `sqlx_smoketest`');

        await db.exec('DROP TABLE IF EXISTS t_smoke');
        await db.exec('CREATE TABLE t_smoke (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(50) NOT NULL)');

        const ins = await db.exec('INSERT INTO t_smoke (name) VALUES (?), (?), (?)', ['alpha', 'beta', 'gamma']);
        console.log('inserted rows:', ins.affectedRows);

        const q = await db.query('SELECT * FROM t_smoke ORDER BY id');
        console.log('rows:', q.rows);

        // Transaction demo
        const total = await db.transaction(async (tx) => {
            await tx.exec('INSERT INTO t_smoke (name) VALUES (?)', ['tx']);
            const { rows } = await tx.query('SELECT COUNT(*) AS c FROM t_smoke');
            return rows[0].c;
        });
        console.log('count after tx:', total);

        // Prepared statement demo
        const stmt = await db.prepare('SELECT name FROM t_smoke WHERE id = ?');
        const one = await stmt.query([1]);
        console.log('id=1 name:', one.rows[0].name);
        await stmt.close();
    } finally {
        await db.close();
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
