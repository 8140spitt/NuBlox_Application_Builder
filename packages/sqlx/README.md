# @nublox/sqlx (MySQL-first)

## Install
```bash
pnpm -C packages/sqlx i
pnpm -C packages/sqlx add mysql2
pnpm -C packages/sqlx add -D typescript @types/node
```

## Build
```bash
pnpm -C packages/sqlx run build
```

## Use
```ts
import { registerMySQL, connect } from '@nublox/sqlx';
registerMySQL();
const db = await connect('mysql://root:pw@127.0.0.1:3306/platform');
const { rows } = await db.query('SELECT 1 AS ok');
console.log(rows);
await db.close();
```
