import { randomBytes, createHmac } from 'node:crypto';

export type SessionRecord = { id: string; user_id: number; created_at: Date };

export interface SessionStore {
    create(userId: number): Promise<SessionRecord>;
    delete(sessionId: string): Promise<void>;
    get(sessionId: string): Promise<SessionRecord | null>;
}

export function sign(value: string, secret: string) {
    return createHmac('sha256', secret).update(value).digest('hex');
}

export function createToken(sessionId: string, secret: string) {
    const sig = sign(sessionId, secret);
    return `${sessionId}.${sig}`;
}

export function verifyToken(token: string, secret: string) {
    const [id, sig] = token.split('.');
    if (!id || !sig) return null;
    return sign(id, secret) === sig ? id : null;
}

export function newSessionId() {
    return randomBytes(18).toString('hex');
}

export function newSessionToken() {
    return randomBytes(32).toString('hex');
}
