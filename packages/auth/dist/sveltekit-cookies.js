// Lightweight cookie helpers that work with SvelteKit's Cookies API
// and any object that implements compatible .set() / .delete() methods.
/**
 * Set the session cookie with secure, httpOnly defaults.
 * Works with SvelteKit's `event.cookies`.
 */
export function setSessionCookie(cookies, token, opts = {}) {
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
export function clearSessionCookie(cookies, opts = {}) {
    const name = opts.name ?? 'nblx_sess';
    const path = opts.path ?? '/';
    cookies.delete(name, { path, domain: opts.domain });
}
