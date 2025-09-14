export type Issue = {
    path: string;
    message: string;
};
export type Result<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    issues: Issue[];
};
declare abstract class VType<T> {
    abstract parse(data: unknown, path?: string): Result<T>;
    safeParse(data: unknown): Result<T>;
    optional(): VType<T | undefined>;
    default(value: T): VType<T>;
}
declare class VString extends VType<string> {
    #private;
    parse(d: unknown, path?: string): Result<string>;
    min(n: number, msg?: string): this;
    max(n: number, msg?: string): this;
    regex(rx: RegExp, msg?: string): this;
    oneOf<T extends string>(vals: readonly T[], msg?: string): VType<T>;
    email(msg?: string): this;
    url(msg?: string): this;
    uuid(msg?: string): this;
}
declare class VNumber extends VType<number> {
    #private;
    parse(d: unknown, path?: string): Result<number>;
    int(msg?: string): this;
    min(n: number, msg?: string): this;
    max(n: number, msg?: string): this;
}
declare class VBoolean extends VType<boolean> {
    parse(d: unknown, path?: string): Result<boolean>;
}
declare class VArray<T> extends VType<T[]> {
    private inner;
    constructor(inner: VType<T>);
    parse(d: unknown, path?: string): Result<T[]>;
}
declare class VObject<T extends Record<string, any>> extends VType<T> {
    private shape;
    constructor(shape: {
        [K in keyof T]: VType<T[K]>;
    });
    parse(d: unknown, path?: string): Result<T>;
}
export declare const v: {
    string: () => VString;
    number: () => VNumber;
    boolean: () => VBoolean;
    array: <T>(t: VType<T>) => VArray<T>;
    object: <T extends Record<string, any>>(shape: { [K in keyof T]: VType<T[K]>; }) => VObject<T>;
};
export {};
