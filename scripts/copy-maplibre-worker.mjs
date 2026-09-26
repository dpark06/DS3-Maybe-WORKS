// MapLibre runs its map code in a module Web Worker. Bundlers do not emit that file on their own,
// so we copy it (and the chunk it imports) into public/maplibre/ and point MapLibre at it in src/map.js.
import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const from = resolve(root, 'node_modules/maplibre-gl/dist');
const to = resolve(root, 'public/maplibre');
mkdirSync(to, { recursive: true });
for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) cpSync(resolve(from, f), resolve(to, f));
console.log('maplibre worker copied to public/maplibre');
