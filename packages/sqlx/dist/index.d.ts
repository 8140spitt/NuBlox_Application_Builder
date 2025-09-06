export type Column = {
    name: string;
    type: string;
    null?: boolean;
    default?: string;
    extra?: string;
};
export type Table = {
    name: string;
    columns: Column[];
    pk?: string[];
};
export declare function createTableSql(t: Table): string;
