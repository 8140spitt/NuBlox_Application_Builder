import { randomBytes, createHmac } from 'node:crypto';
export function sign(value, secret) { return createHmac('sha256', secret).update(value).digest('hex'); }
export function createToken(sessionId, secret) { const sig = sign(sessionId, secret); return `${sessionId}.${sig}`; }
export function verifyToken(token, secret) { const [id, sig] = token.split('.'); if (!id || !sig)
    return null; return sign(id, secret) === sig ? id : null; }
export function newSessionId() { return randomBytes(18).toString('hex'); }
// 32 bytes => 64-char hex fits CHAR(64)
export function newSessionToken() { return randomBytes(32).toString('hex'); }
