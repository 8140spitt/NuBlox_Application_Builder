export type RunnerOptions = {
    url?: string;
    dir: string;
    schema?: string;
    table?: string;
};
export declare function migrate({ url, dir, table }: RunnerOptions): Promise<void>;
