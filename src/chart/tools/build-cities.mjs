#!/usr/bin/env node
// Builds public/geo/cities.json from the GeoNames dump: [label, lat, lon, tz, population], most populous first.
// Run by hand when the place list should be refreshed; the result is committed. `node src/chart/tools/build-cities.mjs`
//
// Data: GeoNames (https://www.geonames.org), CC BY 4.0. The attribution is carried by the licence notices (§17.4).
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const DUMP = 'https://download.geonames.org/export/dump';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../public/geo/cities.json');
// The checklist's ceiling. cities15000 runs past it, so the least populous places fall off the end: "Try the nearest city" covers them.
const MAX_BYTES = 2_000_000;
// Three decimals is about 110 m, or 0.06 arcminutes on the Midheaven: finer than a published chart prints, and it keeps the file small.
const COORD_DECIMALS = 3;

// cities15000.txt columns, per the GeoNames readme.
const NAME = 1, LAT = 4, LON = 5, COUNTRY = 8, ADMIN1 = 10, POPULATION = 14, TIME_ZONE = 17;

async function download(file) {
  const response = await fetch(`${DUMP}/${file}`);
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Reads one named member out of a zip through its central directory, the only record that always holds the sizes. */
function unzipMember(zip, name) {
  let end = zip.length - 22;
  while (end >= 0 && zip.readUInt32LE(end) !== 0x06054b50) end -= 1;
  if (end < 0) throw new Error('not a zip file');
  const entries = zip.readUInt16LE(end + 10);
  let at = zip.readUInt32LE(end + 16);
  for (let i = 0; i < entries; i += 1) {
    const method = zip.readUInt16LE(at + 10);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const extraLength = zip.readUInt16LE(at + 30);
    const commentLength = zip.readUInt16LE(at + 32);
    const local = zip.readUInt32LE(at + 42);
    if (zip.toString('utf8', at + 46, at + 46 + nameLength) === name) {
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      const body = zip.subarray(start, start + size);
      return method === 0 ? body : inflateRawSync(body);
    }
    at += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${name} not found in the zip`);
}

const rows = (buffer) => buffer.toString('utf8').split('\n').filter((line) => line && !line.startsWith('#')).map((line) => line.split('\t'));
const round = (value) => Number(Number(value).toFixed(COORD_DECIMALS));

const [citiesZip, admin1File, countryFile] = await Promise.all([
  download('cities15000.zip'),
  download('admin1CodesASCII.txt'),
  download('countryInfo.txt'),
]);

// admin1CodesASCII.txt: "CA.08", name, ascii name, id. countryInfo.txt: name is column 4.
const admin1Names = new Map(rows(admin1File).map((r) => [r[0], r[1]]));
const countryNames = new Map(rows(countryFile).map((r) => [r[0], r[4]]));

const cities = rows(unzipMember(citiesZip, 'cities15000.txt')).map((r) => {
  const country = countryNames.get(r[COUNTRY]);
  if (!country) throw new Error(`Unknown country code ${r[COUNTRY]}`);
  if (!r[TIME_ZONE]) throw new Error(`${r[NAME]} has no time zone`);
  const admin1 = admin1Names.get(`${r[COUNTRY]}.${r[ADMIN1]}`);
  // A division named like its city, as Singapore or Monaco, reads better once.
  const parts = admin1 && admin1 !== r[NAME] ? [r[NAME], admin1, country] : [r[NAME], country];
  return [parts.join(', '), round(r[LAT]), round(r[LON]), r[TIME_ZONE], Number(r[POPULATION])];
});

cities.sort((a, b) => b[4] - a[4] || a[0].localeCompare(b[0], 'en'));

const FRAME_BYTES = '[\n\n]\n'.length;
let bytes = FRAME_BYTES;
const lines = [];
for (const city of cities) {
  const line = JSON.stringify(city);
  const cost = Buffer.byteLength(line) + 2; // ",\n"
  if (bytes + cost >= MAX_BYTES) break;
  bytes += cost;
  lines.push(line);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `[\n${lines.join(',\n')}\n]\n`);
const floor = cities[lines.length - 1][4];
console.log(`${lines.length} of ${cities.length} places, ${statSync(OUT).size} bytes, smallest population ${floor}`);
