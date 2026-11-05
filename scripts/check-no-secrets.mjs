#!/usr/bin/env node
// §8.3: fails on any recorded secret in dist-web/ and the build logs, or with --staged in the git index.
// Compares hashes of tokens of the matching length, so no secret is held in clear. Prints names and paths, never a match.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const recordPath = join(root, '.generated/secret-values.json');
const SLIDE_LIMIT = 256 * 1024; // Small text gets every window, whatever surrounds the secret; large files get tokens.

if (!existsSync(recordPath)) {
  console.error('check-no-secrets: .generated/secret-values.json is missing; run scripts/resolve-env.mjs first');
  process.exit(1);
}
const { secrets } = JSON.parse(readFileSync(recordPath, 'utf8'));
const byLength = new Map();
for (const s of secrets) {
  if (!byLength.has(s.length)) byLength.set(s.length, new Map());
  byLength.get(s.length).set(s.sha256, s.name);
}
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function* tokens(text) {
  yield* text.split(/[\s"'`<>,;()[\]{}\\]+/);
  yield* text.split(/[\s"'`<>,;()[\]{}\\=:&?/|]+/);
}
function scan(label, bytes, hits) {
  if (byLength.size === 0) return;
  const report = (name) => hits.add(`${name} in ${label}`);
  const text = bytes.toString('latin1');
  for (const token of tokens(text)) {
    const candidates = byLength.get(token.length);
    const name = candidates?.get(sha(Buffer.from(token, 'latin1')));
    if (name) report(name);
  }
  if (bytes.length > SLIDE_LIMIT) return;
  for (const [length, candidates] of byLength) {
    for (let i = 0; i + length <= bytes.length; i += 1) {
      const name = candidates.get(sha(bytes.subarray(i, i + length)));
      if (name) report(name);
    }
  }
}
function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const hits = new Set();
let scanned = 0;
if (process.argv.includes('--staged')) {
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 1 << 30 });
  for (const file of git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').toString().split('\0').filter(Boolean)) {
    scan(file, git('show', `:${file}`), hits);
    scanned += 1;
  }
} else {
  const logs = [...walk(join(root, '.tmp'))].filter((p) => p.endsWith('.log'));
  for (const path of [...walk(join(root, 'dist-web')), ...logs]) {
    scan(relative(root, path), readFileSync(path), hits);
    scanned += 1;
  }
}
if (hits.size > 0) {
  for (const hit of [...hits].sort()) console.error(`check-no-secrets: ${hit}`);
  process.exit(1);
}
console.log(`check-no-secrets: clean (${scanned} files, ${secrets.length} secret values)`);
