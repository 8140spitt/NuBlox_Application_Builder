import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerMySQL, connect } from '../../dist/index.js';

registerMySQL();

test('insert & select', async () => {
    const db = await connect(process.env.SQLX_TEST_URL);
    await db.exec('DROP TABLE IF EXISTS t');
    await db.exec('CREATE TABLE t (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(32) NOT NULL)');
    await db.exec('INSERT INTO t (name) VALUES (?), (?)', ['alpha', 'beta']);
    const { rows } = await db.query('SELECT name FROM t ORDER BY id');
    assert.deepEqual(rows.map(r => r.name), ['alpha', 'beta']);
    await db.close();
});
