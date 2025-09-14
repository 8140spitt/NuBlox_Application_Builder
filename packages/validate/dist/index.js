class VType {
    safeParse(data) { return this.parse(data, ""); }
    optional() {
        const base = this;
        return new (class extends VType {
            parse(d, path = "") {
                if (d === undefined || d === null)
                    return { ok: true, value: undefined };
                return base.parse(d, path);
            }
        })();
    }
    default(value) {
        const base = this;
        return new (class extends VType {
            parse(d, path = "") {
                if (d === undefined || d === null)
                    return { ok: true, value };
                return base.parse(d, path);
            }
        })();
    }
}
/* primitives */
class VString extends VType {
    #checks = [];
    parse(d, path = "") {
        if (typeof d !== 'string')
            return { ok: false, issues: [{ path, message: 'Expected string' }] };
        for (const check of this.#checks) {
            const err = check(d);
            if (err)
                return { ok: false, issues: [{ path, message: err }] };
        }
        return { ok: true, value: d };
    }
    min(n, msg = `Must be at least ${n} chars`) { this.#checks.push(s => s.length >= n ? null : msg); return this; }
    max(n, msg = `Must be at most ${n} chars`) { this.#checks.push(s => s.length <= n ? null : msg); return this; }
    regex(rx, msg = 'Invalid format') { this.#checks.push(s => rx.test(s) ? null : msg); return this; }
    // Typed union: returns VType<T> where T is the union of provided literals
    oneOf(vals, msg = `Must be one of ${vals.join(', ')}`) {
        const base = this;
        return new (class extends VType {
            parse(d, path = "") {
                const r = base.parse(d, path);
                if (!r.ok)
                    return r;
                return vals.includes(r.value)
                    ? { ok: true, value: r.value }
                    : { ok: false, issues: [{ path, message: msg }] };
            }
        })();
    }
    email(msg = 'Invalid email') { return this.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg); }
    url(msg = 'Invalid URL') { return this.regex(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, msg); }
    uuid(msg = 'Invalid UUID') { return this.regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, msg); }
}
class VNumber extends VType {
    #checks = [];
    parse(d, path = "") {
        if (typeof d !== 'number' || Number.isNaN(d))
            return { ok: false, issues: [{ path, message: 'Expected number' }] };
        for (const c of this.#checks) {
            const err = c(d);
            if (err)
                return { ok: false, issues: [{ path, message: err }] };
        }
        return { ok: true, value: d };
    }
    int(msg = 'Expected integer') { this.#checks.push(n => Number.isInteger(n) ? null : msg); return this; }
    min(n, msg = `Must be >= ${n}`) { this.#checks.push(v => v >= n ? null : msg); return this; }
    max(n, msg = `Must be <= ${n}`) { this.#checks.push(v => v <= n ? null : msg); return this; }
}
class VBoolean extends VType {
    parse(d, path = "") {
        return typeof d === 'boolean' ? { ok: true, value: d } : { ok: false, issues: [{ path, message: 'Expected boolean' }] };
    }
}
class VArray extends VType {
    inner;
    constructor(inner) {
        super();
        this.inner = inner;
    }
    parse(d, path = "") {
        if (!Array.isArray(d))
            return { ok: false, issues: [{ path, message: 'Expected array' }] };
        const out = [];
        const issues = [];
        d.forEach((item, i) => {
            const r = this.inner.parse(item, `${path}[${i}]`);
            if (r.ok)
                out.push(r.value);
            else
                issues.push(...r.issues);
        });
        return issues.length ? { ok: false, issues } : { ok: true, value: out };
    }
}
class VObject extends VType {
    shape;
    constructor(shape) {
        super();
        this.shape = shape;
    }
    parse(d, path = "") {
        if (typeof d !== 'object' || d === null || Array.isArray(d)) {
            return { ok: false, issues: [{ path, message: 'Expected object' }] };
        }
        const out = {};
        const issues = [];
        for (const k of Object.keys(this.shape)) {
            const r = this.shape[k].parse(d[k], path ? `${path}.${String(k)}` : String(k));
            if (r.ok)
                out[k] = r.value;
            else
                issues.push(...r.issues);
        }
        return issues.length ? { ok: false, issues } : { ok: true, value: out };
    }
}
export const v = {
    string: () => new VString(),
    number: () => new VNumber(),
    boolean: () => new VBoolean(),
    array: (t) => new VArray(t),
    object: (shape) => new VObject(shape)
};
