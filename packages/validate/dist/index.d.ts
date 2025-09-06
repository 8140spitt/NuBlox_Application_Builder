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
}
export declare class VString extends VType<string> {
    private _min?;
    private _max?;
    private _regex?;
    min(n: number): this;
    max(n: number): this;
    regex(r: RegExp): this;
    parse(data: unknown, path?: string): Result<string>;
}
export declare class VNumber extends VType<number> {
    private _min?;
    private _max?;
    private _int;
    min(n: number): this;
    max(n: number): this;
    int(): this;
    parse(d: unknown, path?: string): Result<number>;
}
export declare class VBoolean extends VType<boolean> {
    parse(d: unknown, path?: string): Result<boolean>;
}
export declare class VArray<T> extends VType<T[]> {
    private item;
    constructor(item: VType<T>);
    parse(d: unknown, path?: string): Result<T[]>;
}
export declare class VObject<T extends Record<string, any>> extends VType<T> {
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
