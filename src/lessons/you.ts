// "You and [element]": the one computed block of a lesson. It reads only the chart already on the device, so no network call.
import {
  ANGLE_KEYS,
  HOUSE_KEYS,
  PLANET_KEYS,
  SIGN_KEYS,
  type AngleKey,
  type AspectType,
  type Chart,
  type ChartElementKey,
  type HouseCusp,
  type HouseKey,
  type PlanetKey,
  type SignKey,
  type YouAndElement,
} from '../types';
import { NAMES, degrees, houseLabel, ordinal } from './names';

const norm = (longitude: number) => ((longitude % 360) + 360) % 360;
const isPlanet = (key: string): key is PlanetKey => (PLANET_KEYS as readonly string[]).includes(key);
const isAngle = (key: string): key is AngleKey => (ANGLE_KEYS as readonly string[]).includes(key);
const isSign = (key: string): key is SignKey => (SIGN_KEYS as readonly string[]).includes(key);
const isHouse = (key: string): key is HouseKey => (HOUSE_KEYS as readonly string[]).includes(key);

/** "Venus", "Venus and Mars", "Sun, Venus and Mars". */
function listNames(keys: PlanetKey[]): string {
  const names = keys.map((k) => NAMES[k]);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** The house 1 to 12 holding a longitude: from a cusp up to the next, going forward through the zodiac. */
function houseOf(longitude: number, cusps: HouseCusp[]): number {
  const at = norm(longitude);
  for (let i = 0; i < cusps.length; i += 1) {
    const from = cusps[i]!.longitude;
    const span = norm(cusps[(i + 1) % cusps.length]!.longitude - from);
    if (norm(at - from) < span) return i + 1;
  }
  return 12;
}

const gap = (a: number, b: number) => {
  const d = Math.abs(norm(a) - norm(b));
  return Math.min(d, 360 - d);
};

const within = (orb: number) => (orb < 1 ? 'within a degree of exact' : `within ${Math.ceil(orb)} degrees of exact`);
const linkWord = (type: AspectType) => (type === 'conjunction' ? 'with' : 'to');
const signOfPlanet = (chart: Chart, key: PlanetKey) => chart.planets.find((p) => p.key === key)?.sign;

const NEEDS_ARTICLE = new Set<string>(['sun', 'moon', 'north_node', ...ANGLE_KEYS, ...HOUSE_KEYS]);

function headingFor(key: ChartElementKey): string {
  if (isPlanet(key) || isAngle(key) || isSign(key)) {
    return `You and ${NEEDS_ARTICLE.has(key) ? 'the ' : ''}${NAMES[key]}`;
  }
  if (isHouse(key)) return `You and the ${houseLabel(HOUSE_KEYS.indexOf(key) + 1)}`;
  const [, a, type, b] = key.split(':') as [string, PlanetKey, AspectType, PlanetKey];
  return `You and ${NAMES[a]} ${NAMES[type]} ${NAMES[b]}`;
}

function planetText(chart: Chart, key: PlanetKey): string {
  const planet = chart.planets.find((p) => p.key === key);
  if (!planet) return '';
  const parts = [`Your ${NAMES[key]} is in ${NAMES[planet.sign]} at ${degrees(planet.degree)}, in your ${houseLabel(planet.house)}.`];
  if (planet.retrograde) parts.push('It was moving retrograde when you were born.');
  const closest = chart.aspects.find((a) => a.a === key || a.b === key);
  if (closest) {
    const other = closest.a === key ? closest.b : closest.a;
    const otherSign = signOfPlanet(chart, other);
    parts.push(
      `Its closest aspect is a ${NAMES[closest.type]} ${linkWord(closest.type)} your ${NAMES[other]}${otherSign ? ` in ${NAMES[otherSign]}` : ''}, ${within(closest.orb)}, and it is ${closest.applying ? 'still tightening' : 'already easing'}.`,
    );
  } else {
    parts.push('It makes no close aspect to another planet, so it speaks in its own voice.');
  }
  return parts.join(' ');
}

function angleText(chart: Chart, key: AngleKey): string {
  const angle = chart.angles.find((a) => a.key === key);
  if (!angle) return `Your ${NAMES[key]} depends on your birth time, and this chart was made without one, so I will not guess at it.`;
  const house = houseOf(angle.longitude, chart.houses);
  const parts = [`Your ${NAMES[key]} is in ${NAMES[angle.sign]} at ${degrees(angle.degree)}, falling in your ${houseLabel(house)}.`];
  let nearest: { key: PlanetKey; away: number } | null = null;
  for (const planet of chart.planets) {
    const away = gap(planet.longitude, angle.longitude);
    if (away <= 8 && (!nearest || away < nearest.away)) nearest = { key: planet.key, away };
  }
  parts.push(
    nearest
      ? `Your ${NAMES[nearest.key]} lies about ${degrees(Math.round(nearest.away))} from it, close enough to color how it lands.`
      : 'No planet of yours lies close to it, so its sign tells most of the story.',
  );
  return parts.join(' ');
}

function signText(chart: Chart, key: SignKey): string {
  const inSign = chart.planets.filter((p) => p.sign === key).map((p) => p.key);
  const parts: string[] = [];
  parts.push(
    inSign.length > 0
      ? `Your ${listNames(inSign)} ${inSign.length > 1 ? 'are' : 'is'} in ${NAMES[key]}.`
      : `None of your planets are in ${NAMES[key]}.`,
  );
  const opens = chart.houses.filter((h) => h.sign === key).map((h) => ordinal(h.house));
  if (opens.length > 0) {
    parts.push(`${NAMES[key]} opens your ${opens.join(' and ')} ${opens.length > 1 ? 'Houses' : 'House'}.`);
  } else {
    const start = SIGN_KEYS.indexOf(key) * 30;
    parts.push(`${NAMES[key]} sits inside your ${houseLabel(houseOf(start, chart.houses))} without opening a house of its own.`);
  }
  return parts.join(' ');
}

function houseText(chart: Chart, key: HouseKey): string {
  const number = HOUSE_KEYS.indexOf(key) + 1;
  const cusp = chart.houses[number - 1];
  if (!cusp) return '';
  const placidus = chart.houseSystem === 'placidus';
  const parts = [`Your ${houseLabel(number)} opens in ${NAMES[cusp.sign]}${placidus ? ` at ${degrees(Math.floor(norm(cusp.longitude) % 30))}` : ''}.`];
  const held = chart.planets.filter((p) => p.house === number).map((p) => p.key);
  parts.push(held.length > 0 ? `It holds your ${listNames(held)}.` : 'No planet of yours sits in it, so its sign tells the story.');
  if (!placidus) {
    parts.push(`These are Whole Sign houses, counted from your ${chart.firstHouseFrom === 'sun_sign' ? 'Sun sign' : 'Ascendant'}.`);
  }
  return parts.join(' ');
}

function aspectText(chart: Chart, key: ChartElementKey): string {
  const [, a, type, b] = key.split(':') as [string, PlanetKey, AspectType, PlanetKey];
  const found = chart.aspects.find((x) => x.key === key);
  const signA = signOfPlanet(chart, a);
  const signB = signOfPlanet(chart, b);
  const place = (k: PlanetKey, s: SignKey | undefined) => `your ${NAMES[k]}${s ? ` in ${NAMES[s]}` : ''}`;
  if (!found) {
    return `${place(a, signA)} and ${place(b, signB)} are not close enough for a ${NAMES[type]} in this chart.`.replace(/^./, (c) => c.toUpperCase());
  }
  return `${place(a, signA)} makes a ${NAMES[type]} ${linkWord(type)} ${place(b, signB)}, ${within(found.orb)}, and it is ${found.applying ? 'still tightening' : 'already easing'}.`.replace(/^./, (c) => c.toUpperCase());
}

export function youAndElement(chart: Chart, key: ChartElementKey): YouAndElement {
  let text = '';
  if (isPlanet(key)) text = planetText(chart, key);
  else if (isAngle(key)) text = angleText(chart, key);
  else if (isSign(key)) text = signText(chart, key);
  else if (isHouse(key)) text = houseText(chart, key);
  else text = aspectText(chart, key);
  return { key, heading: headingFor(key), text };
}
