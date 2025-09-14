#!/usr/bin/env node
import { migrate } from './index.js';

const dir = process.argv[2] || 'packages/db/src/migrations';
migrate({ dir }).catch((e) => {
    console.error(e);
    process.exit(1);
});
