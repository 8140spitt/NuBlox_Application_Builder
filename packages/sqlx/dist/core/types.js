/**
 * NuBlox SQLX — Core types (v0.1)
 */
// ---------- Errors ----------
export class SQLError extends Error {
    code;
    dialect;
    cause;
    meta;
    constructor(message, info) {
        super(message);
        this.name = 'SQLError';
        if (info) {
            this.code = info.code;
            this.dialect = info.dialect;
            this.cause = info.cause;
            this.meta = { ...info };
        }
    }
}
