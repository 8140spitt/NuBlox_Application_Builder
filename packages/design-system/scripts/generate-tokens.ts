import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildThemeQuick, toCssTokens, toJsonTokens } from '../src/palettes/palettes-multibrand';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

const override = process.argv[2]?.trim();
function inferHexes(tokensCss: string): string[] {
  if (override) return override.split(',').map(s=>s.trim());
  const ordered = ['primary','secondary','tertiary','quaternary'].map(role => {
    const r = new RegExp(`--nublox-${role}:\s*(#[0-9a-fA-F]{3,6})`,'i');
    const mm = tokensCss.match(r);
    return mm ? mm[1] : null;
  }).filter(Boolean) as string[];
  return ordered.length ? ordered : ['#a65de9','#47a4ff','#47ffd7','#fba94c'];
}

const srcTokens = resolve(root, 'src/css/tokens.css');
let baseCss = '';
try { baseCss = readFileSync(srcTokens, 'utf8'); } catch {}

const hexes = inferHexes(baseCss);
const theme = buildThemeQuick(hexes);

const dist = resolve(root, 'dist');
mkdirSync(dist, { recursive: true });

// Generate with single wrapper; sanitize any accidental \n to 

const cssRaw = toCssTokens(theme, { includeComments: true });
const css = cssRaw.replace(/\\n/g, '\n');

writeFileSync(resolve(dist, 'tokens.css'), css, 'utf8');
writeFileSync(resolve(dist, 'tokens.json'), JSON.stringify(toJsonTokens(theme), null, 2), 'utf8');
writeFileSync(srcTokens, css, 'utf8');

console.log('✅ NuBlox tokens built from:', hexes.join(', '));
