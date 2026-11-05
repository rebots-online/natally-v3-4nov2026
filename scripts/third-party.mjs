#!/usr/bin/env node
// §16.1 step 5: public/third-party.json, the licence of every production dependency.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(execFileSync('pnpm', ['licenses', 'list', '--prod', '--json'], { cwd: root, maxBuffer: 1 << 28 }).toString());
const rows = [];
for (const [license, packages] of Object.entries(report)) {
  for (const p of packages) {
    for (const version of p.versions) rows.push({ name: p.name, version, license });
  }
}
rows.sort((a, b) => a.name.localeCompare(b.name, 'en') || a.version.localeCompare(b.version, 'en'));
writeFileSync(join(root, 'public/third-party.json'), `${JSON.stringify(rows, null, 1)}\n`);
console.log(`listed ${rows.length} packages in public/third-party.json`);
