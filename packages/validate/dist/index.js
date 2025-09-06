class VType {
    safeParse(data) {
        return this.parse(data, "");
    }
    optional() {
        const base = this;
        return new (class extends VType {
            parse(d, path) {
                if (d === undefined || d === null) {
                    return { ok: true, value: undefined };
                }
                const r = base.parse(d, path);
                return r.ok
                    ? { ok: true, value: r.value }
                    : r;
            }
        })();
    }
}
export class VString extends VType {
    _min;
    _max;
    _regex;
    min(n) { this._min = n; return this; }
    max(n) { this._max = n; return this; }
    regex(r) { this._regex = r; return this; }
    parse(data, path = "") {
        if (typeof data !== "string")
            return { ok: false, issues: [{ path, message: "Expected string" }] };
        if (this._min !== undefined && data.length < this._min)
            return { ok: false, issues: [{ path, message: `Min length ${this._min}` }] };
        if (this._max !== undefined && data.length > this._max)
            return { ok: false, issues: [{ path, message: `Max length ${this._max}` }] };
        if (this._regex && !this._regex.test(data))
            return { ok: false, issues: [{ path, message: "Invalid format" }] };
        return { ok: true, value: data };
    }
}
export class VNumber extends VType {
    _min;
    _max;
    _int = false;
    min(n) { this._min = n; return this; }
    max(n) { this._max = n; return this; }
    int() { this._int = true; return this; }
    parse(d, path = "") {
        if (typeof d !== "number" || Number.isNaN(d))
            return { ok: false, issues: [{ path, message: "Expected number" }] };
        if (this._int && !Number.isInteger(d))
            return { ok: false, issues: [{ path, message: "Expected integer" }] };
        if (this._min !== undefined && d < this._min)
            return { ok: false, issues: [{ path, message: `Min ${this._min}` }] };
        if (this._max !== undefined && d > this._max)
            return { ok: false, issues: [{ path, message: `Max ${this._max}` }] };
        return { ok: true, value: d };
    }
}
export class VBoolean extends VType {
    parse(d, path = "") {
        if (typeof d !== "boolean")
            return { ok: false, issues: [{ path, message: "Expected boolean" }] };
        return { ok: true, value: d };
    }
}
export class VArray extends VType {
    item;
    constructor(item) {
        super();
        this.item = item;
    }
    parse(d, path = "") {
        if (!Array.isArray(d))
            return { ok: false, issues: [{ path, message: "Expected array" }] };
        const out = [];
        const issues = [];
        d.forEach((v, i) => {
            const r = this.item.parse(v, `${path}[${i}]`);
            if (r.ok)
                out.push(r.value);
            else
                issues.push(...r.issues);
        });
        return issues.length ? { ok: false, issues } : { ok: true, value: out };
    }
}
export class VObject extends VType {
    shape;
    constructor(shape) {
        super();
        this.shape = shape;
    }
    parse(d, path = "") {
        if (typeof d !== "object" || d === null || Array.isArray(d))
            return { ok: false, issues: [{ path, message: "Expected object" }] };
        const out = {};
        const issues = [];
        for (const k in this.shape) {
            const r = this.shape[k].parse(d[k], path ? `${path}.${k}` : k);
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
