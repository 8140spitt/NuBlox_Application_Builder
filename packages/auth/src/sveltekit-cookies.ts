// Lightweight cookie helpers that work with SvelteKit's Cookies API
// and any object that implements compatible .set() / .delete() methods.

export type CookieSameSite = 'lax' | 'strict' | 'none';

export type CookieSetOptions = {
    path?: string;
    domain?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: CookieSameSite;
    maxAge?: number;      // seconds
    expires?: Date;       // optional override
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
export function setSessionCookie(
    cookies: CookieJar,
    token: string,
    opts: { name?: string; path?: string; domain?: string; secure?: boolean; sameSite?: CookieSameSite; maxAge?: number } = {}
) {
    const name = opts.name ?? 'nblx_sess';
    const path = opts.path ?? '/';
    const secure = opts.secure ?? true;
    const sameSite = opts.sameSite ?? 'lax';
    const maxAge = opts.maxAge ?? 60 * 60 * 24 * 7; // 7 days

    cookies.set(name, token, {
        path,
        httpOnly: true,
        secure,
        sameSite,
        maxAge
    });
}

/**
 * Clear the session cookie (delete).
 */
export function clearSessionCookie(
    cookies: CookieJar,
    opts: { name?: string; path?: string; domain?: string } = {}
) {
    const name = opts.name ?? 'nblx_sess';
    const path = opts.path ?? '/';
    cookies.delete(name, { path, domain: opts.domain });
}
