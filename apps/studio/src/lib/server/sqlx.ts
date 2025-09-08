import { env } from '$env/dynamic/private';
import { registerMySQL, connect, type SQLClient } from '@nublox/sqlx';
registerMySQL();

let clientPromise: Promise<SQLClient> | null = null;

export async function getDB(): Promise<SQLClient> {
    if (!env.SQLX_DSN) throw new Error('SQLX_DSN not set');
    if (!clientPromise) clientPromise = connect(env.SQLX_DSN); // mysql2 pool under the hood
    return clientPromise;
}
