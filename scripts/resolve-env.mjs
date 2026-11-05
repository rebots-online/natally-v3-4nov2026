#!/usr/bin/env node
// §8.2, §8.3: reads .env (or .env.example), resolves admin-manual: pointers, derives the web origin and writes .generated/*.
// Prints names, paths and counts only. No resolved value is ever printed.
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const generated = join(root, '.generated');
const POINTER = 'admin-manual:';
const EXAMPLE = join(root, '.env.example');

// §17.1. A secret is hashed for scanning; identifiers and paths that are public or harmless are left out.
const SECRETS = new Set([
  'OPENROUTER_MANAGEMENT_KEY', 'OPENROUTER_SOUVENIR_KEY', 'REVENUECAT_SECRET_KEY', 'REVENUECAT_WEBHOOK_AUTH', 'GA_API_SECRET',
  'FIREBASE_ADMIN_CLIENT_EMAIL', 'FIREBASE_ADMIN_PRIVATE_KEY', 'SFTP_PASSWORD', 'SMTP_PASSWORD',
  'SURGE_TOKEN', 'NETLIFY_AUTH_TOKEN', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_PASSWORD',
]);
const REPORTED_LATER = /^VITE_FIREBASE_/; // Required by the app, which shows its configuration state until they are set (§1.5 still runs).

class Fail extends Error {}

function unquote(value) {
  const v = value.trim();
  const q = v[0];
  return v.length >= 2 && (q === '"' || q === "'" || q === '`') && v.at(-1) === q ? v.slice(1, -1) : v;
}
function parseEnv(text) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=(.*)$/.exec(line);
    if (m && !line.trimStart().startsWith('#')) out.set(m[1], unquote(m[2]));
  }
  return out;
}
/** The table of §8.1, carried by the comment line above each variable in .env.example. */
function parseCatalogue(text) {
  const out = new Map();
  let meta = null;
  for (const line of text.split(/\r?\n/)) {
    const c = /^# \[([CSB ]+)\] \[([RDOG])\]/.exec(line);
    const v = /^([A-Z][A-Z0-9_]*)=/.exec(line);
    if (c) meta = { readers: c[1].split(' '), req: c[2] };
    else if (v && meta) { out.set(v[1], meta); meta = null; }
  }
  return out;
}
function resolvePointer(name, raw, base) {
  const spec = raw.slice(POINTER.length);
  const hash = spec.lastIndexOf('#');
  if (hash < 0) throw new Fail(`${name}: pointer has no #KEY`);
  const path = spec.slice(0, hash);
  const key = spec.slice(hash + 1);
  const where = `${POINTER}${path}`;
  if (!base) throw new Fail(`${name}: ${where} needs ADMIN_MANUAL_PATH`);
  if (!existsSync(base)) throw new Fail(`${name}: Admin-Manual checkout is missing for ${where}`);
  const file = resolve(base, path);
  if (!existsSync(file)) throw new Fail(`${name}: file not found: ${where}`);
  const text = readFileSync(file, 'utf8');
  let value;
  if (path.endsWith('.json')) {
    try {
      value = JSON.parse(text)[key];
    } catch {
      throw new Fail(`${name}: not valid JSON: ${where}`);
    }
  } else {
    value = parseEnv(text).get(key);
  }
  if (value === undefined || value === null || value === '') throw new Fail(`${name}: key ${key} not found in ${where}`);
  return String(value);
}
function parseTargets(raw) {
  let targets;
  try {
    targets = JSON.parse(raw);
  } catch {
    throw new Fail('WEB_DEPLOY_TARGETS: not valid JSON');
  }
  const good = Array.isArray(targets) && targets.length > 0 && targets.every(
    (t) => t && typeof t.domain === 'string' && t.domain && (t.type === 'surge' || t.type === 'netlify') && typeof t.https === 'boolean',
  );
  if (!good) throw new Fail('WEB_DEPLOY_TARGETS: each entry needs domain, type (surge or netlify) and https (true or false)');
  return targets;
}
/** A value that survives the dotenv parser (Vite, Netlify): no comment cut, no $ expansion. */
function dotenvLine(name, value) {
  const safe = value.replaceAll('$', '\\$').replaceAll('\n', '\\n');
  if (/^[\w./:@,+-]*$/.test(safe)) return `${name}=${safe}`;
  const quote = !safe.includes("'") ? "'" : !safe.includes('"') ? '"' : '`';
  return `${name}=${quote}${safe}${quote}`;
}
function writeGenerated(file, text) {
  const path = join(generated, file);
  writeFileSync(path, text, { mode: 0o600 });
  chmodSync(path, 0o600);
}
function secretEntries(values) {
  const entries = [];
  const add = (name, text) => entries.push({
    name, sha256: createHash('sha256').update(text, 'utf8').digest('hex'), length: Buffer.byteLength(text, 'utf8'),
  });
  for (const [name, value] of values) {
    if (!value || !(SECRETS.has(name) || name === 'FIREBASE_DEPLOY_SA_FILE')) continue;
    add(name, value);
    // A multi-line secret (a private key) is scanned line by line too.
    const lines = value.split(/\\n|\r?\n/);
    if (lines.length > 1) lines.filter((l) => l.length >= 16).forEach((l) => add(name, l));
  }
  return entries;
}
function contentSecurityPolicy(values) {
  const origins = new Set();
  for (const name of ['VITE_API_BASE_URL', 'VITE_VOICE_BASE_URL']) {
    try {
      origins.add(new URL(values.get(name)).origin);
    } catch {
      throw new Fail(`${name}: not a valid URL`);
    }
  }
  const known = ['https://huggingface.co'];
  const connect = [...origins].filter((o) => !known.includes(o)).join(' ');
  return [
    "default-src 'self' tauri: https://tauri.localhost ipc: http://ipc.localhost",
    "script-src 'self' 'wasm-unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.google.com https://js.stripe.com",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "media-src 'self' blob:",
    `connect-src 'self' ipc: http://ipc.localhost https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://openrouter.ai https://api.revenuecat.com https://*.revenuecat.com https://api.stripe.com https://huggingface.co https://*.hf.co https://*.huggingface.co ${connect}`.trimEnd(),
    'frame-src https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net https://js.stripe.com https://*.stripe.com https://*.revenuecat.com',
  ].join('; ');
}

function main() {
  const catalogue = parseCatalogue(readFileSync(EXAMPLE, 'utf8'));
  const envPath = join(root, '.env');
  const usedExample = !existsSync(envPath);
  const source = parseEnv(readFileSync(usedExample ? EXAMPLE : envPath, 'utf8'));

  const base = source.get('ADMIN_MANUAL_PATH') ?? '';
  const values = new Map();
  for (const name of catalogue.keys()) {
    const raw = source.get(name) ?? '';
    values.set(name, raw.startsWith(POINTER) ? resolvePointer(name, raw, base) : raw);
  }

  const targets = parseTargets(values.get('WEB_DEPLOY_TARGETS') || '[]');
  const canonical = targets.find((t) => t.https);
  values.set('VITE_WEB_CANONICAL_ORIGIN', canonical ? `https://${canonical.domain}` : '');
  values.set('VITE_WEB_DOMAINS', targets.map((t) => t.domain).join(','));
  if (!canonical) console.log('warning: WEB_DEPLOY_TARGETS has no https target, so the app runs without a secure origin (§1.5, row 3)');

  const versionFile = join(generated, 'version.json');
  const stamped = existsSync(versionFile) ? JSON.parse(readFileSync(versionFile, 'utf8')) : null;
  if (stamped) values.set('VITE_APP_VERSION', stamped.version);
  if (!values.get('VITE_BUILD_TARGET')) values.set('VITE_BUILD_TARGET', 'web');

  const empty = (name) => !values.get(name);
  const required = [...catalogue].filter(([name, m]) => m.req === 'R' && empty(name)).map(([name]) => name);
  const hard = required.filter((name) => !REPORTED_LATER.test(name));
  if (hard.length) throw new Fail(`required variable not set: ${hard.join(', ')}`);

  const pick = (reader) => [...catalogue].filter(([, m]) => m.readers.includes(reader)).map(([name]) => name);
  const tauriVersion = values.get('VITE_APP_VERSION').split('.').map(Number).join('.'); // semver has no leading zeros
  mkdirSync(generated, { recursive: true, mode: 0o700 });
  writeGenerated('.env', `${pick('C').map((n) => dotenvLine(n, values.get(n))).join('\n')}\n`);
  writeGenerated('server.env', `${pick('S').map((n) => dotenvLine(n, values.get(n))).join('\n')}\n`);
  writeGenerated('build.json', `${JSON.stringify(Object.fromEntries(pick('B').map((n) => [n, values.get(n)])), null, 2)}\n`);
  writeGenerated('secret-values.json', `${JSON.stringify({ secrets: secretEntries(values) }, null, 2)}\n`);
  writeGenerated('tauri.override.json', `${JSON.stringify({
    productName: values.get('VITE_APP_NAME'),
    identifier: values.get('VITE_APP_ID'),
    version: tauriVersion,
    ...(stamped ? { bundle: { android: { versionCode: stamped.versionCode } } } : {}),
    app: { security: { csp: contentSecurityPolicy(values) } },
  }, null, 2)}\n`);

  console.log(`resolved ${values.size} variables from ${usedExample ? '.env.example' : '.env'}; wrote .generated/ (mode 600)`);
  const later = required.filter((name) => REPORTED_LATER.test(name));
  if (later.length) console.log(`ACTION NEEDED: set ${later.join(', ')}; until then the app shows its configuration state`);
}

try {
  main();
} catch (err) {
  // Foreign error messages can quote their input, so only our own are shown in full.
  console.error(err instanceof Fail ? `resolve-env: ${err.message}` : `resolve-env: failed (${err?.code ?? err?.name ?? 'error'})`);
  process.exit(1);
}
