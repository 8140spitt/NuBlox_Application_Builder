export declare function hashPassword(password: string): string;
export declare function verifyPassword(password: string, stored: string): boolean;
export declare function hashPasswordV2(password: string): {
    salt: Buffer<ArrayBufferLike>;
    hash: Buffer<ArrayBufferLike>;
    saltHex: string;
    hashHex: string;
};
export declare function verifyPasswordV2(password: string, salt: Buffer | string, hash: Buffer | string): boolean;
