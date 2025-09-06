// apps/studio/src/lib/server/auth.ts
// Auth utilities aligned to nublox_studio schema
// - Passwords: `credentials` (credential_type='password') storing VARBINARY salt/hash
// - Sessions:  `user_sessions` (session_token char(64), expires_at)
// No schema changes required.

import {
    randomBytes,
    scrypt as _scrypt,
    timingSafeEqual,
    type BinaryLike,
    type ScryptOptions
} from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const SESSION_COOKIE = 'nb_session';
const DAY = 24 * 60 * 60; // seconds

// ---------------------------------------------------------------------------
// scrypt wrapper (Promise-based, well-typed)
// ---------------------------------------------------------------------------
function scryptAsync(
    password: BinaryLike,
    salt: BinaryLike,
    keylen: number,
    options: ScryptOptions
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        _scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key as Buffer)));
    });
}

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keyLen: 64 as const };

async function scryptDerive(password: string, salt: Buffer, keyLen?: number) {
    const { N, r, p } = SCRYPT_PARAMS;
    return scryptAsync(password, salt, keyLen ?? SCRYPT_PARAMS.keyLen, { N, r, p });
}

export async function hashPassword(password: string): Promise<{ hash: Buffer; salt: Buffer }> {
    if (!password) throw new Error('Password required');
    const salt = randomBytes(16);
    const hash = await scryptDerive(password, salt);
    return { hash, salt };
}

export async function verifyPasswordWithSalt(password: string, salt: Buffer, expectedHash: Buffer) {
    const derived = await scryptDerive(password, salt, expectedHash.length);
    return derived.length === expectedHash.length && timingSafeEqual(derived, expectedHash);
}

// ---------------------------------------------------------------------------
// Credentials (table: credentials)
// ---------------------------------------------------------------------------
export async function getUserAndPasswordCredByUsername(username: string): Promise<{
    user: { id: number; username: string; status: 'active' | 'inactive' | 'banned' };
    cred: { hash: Buffer; salt: Buffer } | null;
} | null> {
    const rows = await db.query<{
        id: number;
        username: string;
        status: 'active' | 'inactive' | 'banned';
        credential_value_hash: Buffer | null;
        salt: Buffer | null;
    }>(
        `SELECT u.id, u.username, u.status, c.credential_value_hash, c.salt
		   FROM users u
		   LEFT JOIN credentials c
		         ON c.user_id = u.id
		        AND c.credential_type = 'password'
		        AND c.deleted_at IS NULL
		  WHERE u.username = ?
		  ORDER BY c.id DESC
		  LIMIT 1`,
        [username]
    );

    if (!rows[0]) return null;

    const { id, username: uname, status, credential_value_hash, salt } = rows[0];
    const cred = credential_value_hash && salt ? { hash: credential_value_hash, salt } : null;
    return { user: { id, username: uname, status }, cred };
}

export async function setUserPassword(userId: number, password: string) {
    const { hash, salt } = await hashPassword(password);
    await db.exec(
        `INSERT INTO credentials (user_id, credential_type, credential_value_hash, salt, created_at)
		 VALUES (?, 'password', ?, ?, NOW())`,
        [userId, hash, salt]
    );
}

/** Returns { userId } if valid, else null. */
export async function validateUsernamePassword(
    username: string,
    password: string
): Promise<{ userId: number } | null> {
    const found = await getUserAndPasswordCredByUsername(username);
    if (!found || found.user.status !== 'active' || !found.cred) return null;
    const ok = await verifyPasswordWithSalt(password, found.cred.salt, found.cred.hash);
    return ok ? { userId: found.user.id } : null;
}

// ---------------------------------------------------------------------------
// Sessions (table: user_sessions)
// ---------------------------------------------------------------------------
function cookieOpts(maxAgeSeconds: number): Parameters<Cookies['set']>[2] {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd, // true in prod; false on localhost
        maxAge: maxAgeSeconds
    };
}

export async function createSession(
    cookies: Cookies,
    userId: number,
    { remember = true }: { remember?: boolean } = {}
) {
    const token = randomBytes(32).toString('hex'); // 64 chars → fits CHAR(64)
    const ttl = remember ? 30 * DAY : DAY;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await db.exec(
        `INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
		 VALUES (?, ?, ?, NOW())`,
        [userId, token, expiresAt]
    );

    cookies.set(SESSION_COOKIE, token, cookieOpts(ttl));
    return { token, expiresAt };
}

export async function destroySession(cookies: Cookies, token?: string | null) {
    const t = token ?? cookies.get(SESSION_COOKIE) ?? null;
    if (t) await db.exec(`DELETE FROM user_sessions WHERE session_token = ?`, [t]);
    cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function readSession(cookies: Cookies): Promise<{
    token: string;
    user: { id: number; username: string; status: 'active' | 'inactive' | 'banned' };
} | null> {
    const token = cookies.get(SESSION_COOKIE);
    if (!token) return null;

    const [row] = await db.query<{
        id: number;
        username: string;
        status: 'active' | 'inactive' | 'banned';
        expires_at: Date;
    }>(
        `SELECT u.id, u.username, u.status, s.expires_at
		   FROM user_sessions s
		   JOIN users u ON u.id = s.user_id
		  WHERE s.session_token = ?
		    AND s.deleted_at IS NULL
		    AND s.expires_at > NOW()
		  LIMIT 1`,
        [token]
    );

    if (!row) return null;
    return { token, user: { id: row.id, username: row.username, status: row.status } };
}