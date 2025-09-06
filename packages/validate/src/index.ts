export type Issue = { path: string; message: string };
export type Result<T> = { ok: true; value: T } | { ok: false; issues: Issue[] };

abstract class VType<T> {
  abstract parse(data: unknown, path?: string): Result<T>;

  safeParse(data: unknown) {
    return this.parse(data, "");
  }

  optional(): VType<T | undefined> {
    const base = this;
    return new (class extends VType<T | undefined> {
      parse(d: unknown, path?: string): Result<T | undefined> {
        if (d === undefined || d === null) {
          return { ok: true, value: undefined };
        }
        const r = base.parse(d, path);
        return r.ok
          ? { ok: true, value: r.value as T | undefined }
          : (r as Result<T | undefined>);
      }
    })();
  }
}

export class VString extends VType<string> {
  private _min?: number;
  private _max?: number;
  private _regex?: RegExp;

  min(n: number) { this._min = n; return this; }
  max(n: number) { this._max = n; return this; }
  regex(r: RegExp) { this._regex = r; return this; }

  parse(data: unknown, path = ""): Result<string> {
    if (typeof data !== "string") return { ok: false, issues: [{ path, message: "Expected string" }] };
    if (this._min !== undefined && data.length < this._min) return { ok: false, issues: [{ path, message: `Min length ${this._min}` }] };
    if (this._max !== undefined && data.length > this._max) return { ok: false, issues: [{ path, message: `Max length ${this._max}` }] };
    if (this._regex && !this._regex.test(data)) return { ok: false, issues: [{ path, message: "Invalid format" }] };
    return { ok: true, value: data };
  }
}

export class VNumber extends VType<number> {
  private _min?: number;
  private _max?: number;
  private _int = false;

  min(n: number) { this._min = n; return this; }
  max(n: number) { this._max = n; return this; }
  int() { this._int = true; return this; }

  parse(d: unknown, path = ""): Result<number> {
    if (typeof d !== "number" || Number.isNaN(d)) return { ok: false, issues: [{ path, message: "Expected number" }] };
    if (this._int && !Number.isInteger(d)) return { ok: false, issues: [{ path, message: "Expected integer" }] };
    if (this._min !== undefined && d < this._min) return { ok: false, issues: [{ path, message: `Min ${this._min}` }] };
    if (this._max !== undefined && d > this._max) return { ok: false, issues: [{ path, message: `Max ${this._max}` }] };
    return { ok: true, value: d };
  }
}

export class VBoolean extends VType<boolean> {
  parse(d: unknown, path = ""): Result<boolean> {
    if (typeof d !== "boolean") return { ok: false, issues: [{ path, message: "Expected boolean" }] };
    return { ok: true, value: d };
  }
}

export class VArray<T> extends VType<T[]> {
  constructor(private item: VType<T>) { super(); }

  parse(d: unknown, path = ""): Result<T[]> {
    if (!Array.isArray(d)) return { ok: false, issues: [{ path, message: "Expected array" }] };
    const out: T[] = [];
    const issues: Issue[] = [];
    d.forEach((v, i) => {
      const r = this.item.parse(v, `${path}[${i}]`);
      if (r.ok) out.push(r.value);
      else issues.push(...r.issues);
    });
    return issues.length ? { ok: false, issues } : { ok: true, value: out };
  }
}

export class VObject<T extends Record<string, any>> extends VType<T> {
  constructor(private shape: { [K in keyof T]: VType<T[K]> }) { super(); }

  parse(d: unknown, path = ""): Result<T> {
    if (typeof d !== "object" || d === null || Array.isArray(d))
      return { ok: false, issues: [{ path, message: "Expected object" }] };
    const out: any = {};
    const issues: Issue[] = [];
    for (const k in this.shape) {
      const r = this.shape[k].parse((d as any)[k], path ? `${path}.${k}` : k);
      if (r.ok) out[k] = r.value;
      else issues.push(...r.issues);
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
