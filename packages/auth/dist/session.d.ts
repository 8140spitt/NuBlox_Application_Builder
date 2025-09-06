export type SessionRecord = {
    id: string;
    user_id: number;
    created_at: Date;
};
export declare function sign(value: string, secret: string): string;
export declare function createToken(sessionId: string, secret: string): string;
export declare function verifyToken(token: string, secret: string): string | null;
export declare function newSessionId(): string;
export declare function newSessionToken(): string;
