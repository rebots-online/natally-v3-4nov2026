#!/usr/bin/env node
// §16.1 step 7: the Surge fallback, release.json and the frozen atelier package files (§14.6).
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist-web');
const { version } = JSON.parse(readFileSync(join(root, '.generated/version.json'), 'utf8'));
const env = parseEnv(readFileSync(join(root, '.generated/.env'), 'utf8'));

copyFileSync(join(dist, 'index.html'), join(dist, '200.html'));

writeFileSync(join(dist, 'release.json'), `${JSON.stringify({
  version,
  urls: { android: env.VITE_LINK_PLAY ?? '', windows: env.VITE_LINK_WINDOWS ?? '', linux: env.VITE_LINK_LINUX ?? '' },
})}\n`);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const runtime = join(dist, 'souvenir-runtime');
if (existsSync(join(runtime, 'souvenir.html'))) {
  renameSync(join(runtime, 'souvenir.html'), join(runtime, 'index.html'));
  const assets = [
    'atelier/room.webp', 'atelier/puppet-cleanplate.webp', 'atelier/audio/workshop-ambience.mp3',
    'brand/192x192.png', 'brand/natally-still.webp',
  ];
  for (const file of assets) {
    mkdirSync(dirname(join(runtime, file)), { recursive: true });
    copyFileSync(join(root, 'public', file), join(runtime, file));
  }
  cpSync(join(root, 'public/fonts'), join(runtime, 'fonts'), { recursive: true });
  const files = [...walk(runtime)].map((p) => relative(runtime, p)).sort();
  writeFileSync(join(runtime, 'souvenir-manifest.json'), `${JSON.stringify({ version, files }, null, 1)}\n`);
  console.log(`souvenir-runtime: ${files.length} files`);
} else {
  console.log('souvenir-runtime: not built yet, no package files');
}
console.log(`wrote 200.html and release.json for v${version}`);
