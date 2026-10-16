// Copies the built JSON API (site/dist/api) into the repository's /api folder.
import { cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const from = fileURLToPath(new URL('../dist/api', import.meta.url));
const to = fileURLToPath(new URL('../../api', import.meta.url));
if (!existsSync(from)) throw new Error('dist/api not found. Run `astro build` first.');
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log('Synced JSON API to /api');
