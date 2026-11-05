#!/usr/bin/env node
// §16.1 step 4: the voice runtime's WASM and loaders, from the pinned package into public/ort/.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules/onnxruntime-web/dist');
const to = join(root, 'public/ort');
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
const files = readdirSync(from).filter((f) => f.endsWith('.wasm') || f.endsWith('.mjs'));
if (files.length === 0) throw new Error('onnxruntime-web/dist holds no .wasm or .mjs');
for (const file of files) copyFileSync(join(from, file), join(to, file));
console.log(`copied ${files.length} files to public/ort/`);
