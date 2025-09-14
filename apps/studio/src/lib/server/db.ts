import { createDB } from '@nublox/db';

let _db: Awaited<ReturnType<typeof createDB>> | null = null;

export async function db() {
    if (_db) return _db;
    const url = process.env.DATABASE_URL || 'mysql://root:root@127.0.0.1:3306/nublox';
    _db = await createDB(url);
    return _db;
}
