export type Issue = { path: string; message: string };
export type Result<T> = { ok: true; value: T } | { ok: false; issues: Issue[] };

abstract class VType<T> {
  abstract parse(data: unknown, path?: string): Result<T>;
  safeParse(data: unknown) { return this.parse(data, ""); }

  optional(): VType<T | undefined> {
    const base = this;
    return new (class extends VType<T | undefined> {
      parse(d: unknown, path = ""): Result<T | undefined> {
        if (d === undefined || d === null) return { ok: true, value: undefined };
        return base.parse(d, path);
      }
    })();
  }

  default(value: T): VType<T> {
    const base = this;
    return new (class extends VType<T> {
      parse(d: unknown, path = ""): Result<T> {
        if (d === undefined || d === null) return { ok: true, value };
        return base.parse(d, path);
      }
    })();
  }
}

/* primitives */
class VString extends VType<string> {
  #checks: ((s: string) => string | null)[] = [];
  parse(d: unknown, path = ""): Result<string> {
    if (typeof d !== 'string') return { ok: false, issues: [{ path, message: 'Expected string' }] };
    for (const check of this.#checks) {
      const err = check(d);
      if (err) return { ok: false, issues: [{ path, message: err }] };
    }
    return { ok: true, value: d };
  }
  min(n: number, msg = `Must be at least ${n} chars`) { this.#checks.push(s => s.length >= n ? null : msg); return this; }
  max(n: number, msg = `Must be at most ${n} chars`) { this.#checks.push(s => s.length <= n ? null : msg); return this; }
  regex(rx: RegExp, msg = 'Invalid format') { this.#checks.push(s => rx.test(s) ? null : msg); return this; }

  // Typed literal union
  oneOf<T extends string>(vals: readonly T[], msg = `Must be one of ${vals.join(', ')}`): VType<T> {
    const base = this;
    return new (class extends VType<T> {
      parse(d: unknown, path = ""): Result<T> {
        const r = base.parse(d, path);
        if (!r.ok) return r as unknown as Result<T>;
        return (vals as readonly string[]).includes(r.value)
          ? { ok: true, value: r.value as T }
          : { ok: false, issues: [{ path, message: msg }] };
      }
    })();
  }

  email(msg = 'Invalid email') { return this.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg); }
  url(msg = 'Invalid URL') { return this.regex(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, msg); }
  uuid(msg = 'Invalid UUID') { return this.regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, msg); }
}

class VNumber extends VType<number> {
  #checks: ((n: number) => string | null)[] = [];
  parse(d: unknown, path = ""): Result<number> {
    if (typeof d !== 'number' || Number.isNaN(d)) return { ok: false, issues: [{ path, message: 'Expected number' }] };
    for (const c of this.#checks) { const err = c(d); if (err) return { ok: false, issues: [{ path, message: err }] }; }
    return { ok: true, value: d };
  }
  int(msg = 'Expected integer') { this.#checks.push(n => Number.isInteger(n) ? null : msg); return this; }
  min(n: number, msg = `Must be >= ${n}`) { this.#checks.push(v => v >= n ? null : msg); return this; }
  max(n: number, msg = `Must be <= ${n}`) { this.#checks.push(v => v <= n ? null : msg); return this; }
}

class VBoolean extends VType<boolean> {
  parse(d: unknown, path = ""): Result<boolean> {
    return typeof d === 'boolean' ? { ok: true, value: d } : { ok: false, issues: [{ path, message: 'Expected boolean' }] };
  }
}

class VArray<T> extends VType<T[]> {
  constructor(private inner: VType<T>) { super(); }
  parse(d: unknown, path = ""): Result<T[]> {
    if (!Array.isArray(d)) return { ok: false, issues: [{ path, message: 'Expected array' }] };
    const out: T[] = []; const issues: Issue[] = [];
    d.forEach((item, i) => {
      const r = this.inner.parse(item, `${path}[${i}]`);
      if (r.ok) out.push(r.value); else issues.push(...r.issues);
    });
    return issues.length ? { ok: false, issues } : { ok: true, value: out };
  }
}

class VObject<T extends Record<string, any>> extends VType<T> {
  constructor(private shape: { [K in keyof T]: VType<T[K]> }) { super(); }
  parse(d: unknown, path = ""): Result<T> {
    if (typeof d !== 'object' || d === null || Array.isArray(d)) return { ok: false, issues: [{ path, message: 'Expected object' }] };
    const out: Partial<T> = {}; const issues: Issue[] = [];
    for (const k of Object.keys(this.shape) as (keyof T)[]) {
      const r = this.shape[k].parse((d as any)[k], path ? `${path}.${String(k)}` : String(k));
      if (r.ok) out[k] = r.value; else issues.push(...r.issues);
    }
    return issues.length ? { ok: false, issues } : { ok: true, value: out as T };
  }
}

export const v = {
  string: () => new VString(),
  number: () => new VNumber(),
  boolean: () => new VBoolean(),
  array: <T>(t: VType<T>) => new VArray<T>(t),
  object: <T extends Record<string, any>>(shape: { [K in keyof T]: VType<T[K]> }) => new VObject<T>(shape)
};
