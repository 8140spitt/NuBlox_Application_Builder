# NuBlox v2 — Monorepo Scaffold (Fixed)

**Fixes:**
- Removed `packageManager` to silence Corepack warnings.
- Added Node types across packages & apps.
- Tightened MySQL typings.

See original README for commands. After unzip:
```bash
pnpm install
pnpm run build:packages
mysql -h 127.0.0.1 -u root -p nublox < packages/sqlx/migrations/0001_init_mysql.sql
pnpm dev
```
