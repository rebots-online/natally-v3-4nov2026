#!/usr/bin/env node
// §16.2: the only place a version is set. MAJOR.MINOR.BUILD; MINOR +1 each run; BUILD from the clock.
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const statePath = join(root, 'scripts/version-state.json');
const state = JSON.parse(readFileSync(statePath, 'utf8'));
const minor = state.minor + 1;
const build = String(Math.floor(Date.now() / 60000) % 100000).padStart(5, '0');
const version = `${state.major}.${minor}.${build}`;
const versionCode = state.major * 100000 + minor;

writeFileSync(statePath, `${JSON.stringify({ major: state.major, minor })}\n`);
const generated = join(root, '.generated');
mkdirSync(generated, { recursive: true, mode: 0o700 });
const out = join(generated, 'version.json');
writeFileSync(out, `${JSON.stringify({ version, versionCode })}\n`, { mode: 0o600 });
chmodSync(out, 0o600);
console.log(`version v${version}, code ${versionCode}`);
