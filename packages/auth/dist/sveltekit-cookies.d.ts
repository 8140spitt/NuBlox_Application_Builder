export type CookieSameSite = 'lax' | 'strict' | 'none';
export type CookieSetOptions = {
    path?: string;
    domain?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: CookieSameSite;
    maxAge?: number;
    expires?: Date;
    priority?: 'low' | 'medium' | 'high';
};
export type CookieDeleteOptions = {
    path?: string;
    domain?: string;
};
export type CookieJar = {
    set(name: string, value: string, opts?: CookieSetOptions): void;
    delete(name: string, opts?: CookieDeleteOptions): void;
};
/**
 * Set the session cookie with secure, httpOnly defaults.
 * Works with SvelteKit's `event.cookies`.
 */
export declare function setSessionCookie(cookies: CookieJar, token: string, opts?: {
    name?: string;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: CookieSameSite;
    maxAge?: number;
}): void;
/**
 * Clear the session cookie (delete).
 */
export declare function clearSessionCookie(cookies: CookieJar, opts?: {
    name?: string;
    path?: string;
    domain?: string;
}): void;
