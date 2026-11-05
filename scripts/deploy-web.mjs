#!/usr/bin/env node
// §16.1 step 8: one deploy per WEB_DEPLOY_TARGETS entry. Soft per domain. Tools' output stays out of the terminal and goes,
// without their environment, to .tmp/deploy-<domain>.log, which check-no-secrets also scans.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const build = JSON.parse(readFileSync(join(root, '.generated/build.json'), 'utf8'));
const { version } = JSON.parse(readFileSync(join(root, '.generated/version.json'), 'utf8'));
const targets = JSON.parse(build.WEB_DEPLOY_TARGETS);
const tmp = join(root, '.tmp');
mkdirSync(tmp, { recursive: true });

const tool = (name) => join(root, 'node_modules/.bin', name);

function run(domain, command, args, env) {
  const result = spawnSync(command, args, {
    cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 15 * 60 * 1000,
    env: { ...process.env, ...env, CI: '1' },
  });
  writeFileSync(join(tmp, `deploy-${domain}.log`), `${result.stdout ?? ''}\n${result.stderr ?? ''}\n`, { mode: 0o600 });
  return result.status === 0;
}

function deploy(target) {
  if (target.type === 'surge') {
    if (!build.SURGE_TOKEN) return 'set SURGE_TOKEN';
    const env = { SURGE_TOKEN: build.SURGE_TOKEN, ...(build.SURGE_LOGIN ? { SURGE_LOGIN: build.SURGE_LOGIN } : {}) };
    return run(target.domain, tool('surge'), ['dist-web', target.domain], env) ? null : `surge refused ${target.domain}; see .tmp/deploy-${target.domain}.log`;
  }
  if (!build.NETLIFY_AUTH_TOKEN || !build.NETLIFY_SITE_ID) return 'set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID';
  const args = ['deploy', '--prod', '--dir', 'dist-web', '--site', build.NETLIFY_SITE_ID];
  return run(target.domain, tool('netlify'), args, { NETLIFY_AUTH_TOKEN: build.NETLIFY_AUTH_TOKEN }) ? null : `netlify refused ${target.domain}; see .tmp/deploy-${target.domain}.log`;
}

async function probe(target) {
  const base = `${target.https ? 'https' : 'http'}://${target.domain}`;
  const out = { url: `${base}/`, status: 0, live: false };
  for (let attempt = 0; attempt < 4 && !out.live; attempt += 1) {
    if (attempt > 0) await new Promise((done) => setTimeout(done, 3000));
    try {
      out.status = (await fetch(`${base}/`, { redirect: 'manual', signal: AbortSignal.timeout(15000) })).status;
      const release = await fetch(`${base}/release.json`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      out.live = release.ok && (await release.json()).version === version;
    } catch {
      out.live = false;
    }
  }
  return out;
}

const status = [];
for (const target of targets) {
  const refused = deploy(target);
  if (refused) {
    console.log(`ACTION NEEDED: ${refused}`);
    status.push({ ...target, deployed: false, url: '', status: 0, live: false });
    continue;
  }
  const seen = await probe(target);
  console.log(`${seen.url} ${seen.status || 'no answer'}, ${seen.live ? `serving v${version}` : `not serving v${version}`}`);
  if (!seen.live) console.log(`ACTION NEEDED: check ${seen.url}: deployed, but v${version} is not being served there`);
  status.push({ ...target, deployed: true, ...seen });
}
writeFileSync(join(tmp, 'deploy-status.json'), `${JSON.stringify({ version, targets: status }, null, 1)}\n`);
