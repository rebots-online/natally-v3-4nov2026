// computeChart, computeTransits, computeSynastry (§5.8). Rules: checklist T07.
import {
  PLANET_KEYS,
  SIGN_KEYS,
  type AngleKey,
  type AnglePosition,
  type AspectType,
  type BirthDetails,
  type Chart,
  type ChartAspect,
  type HouseCusp,
  type HouseSystem,
  type HouseSystemReason,
  type IsoInstant,
  type PlanetPosition,
  type SignKey,
  type SynastryPair,
  type TransitSnapshot,
} from '../types';
import { loadEphemeris, type Ephemeris } from './ephemeris';
import { localToUtc } from './time';

const POLAR_LATITUDE = 66;
const NOON = 12;
/** Largest orb for each aspect, in degrees. */
const ASPECTS: { type: AspectType; angle: number; orb: number }[] = [
  { type: 'conjunction', angle: 0, orb: 8 },
  { type: 'sextile', angle: 60, orb: 5 },
  { type: 'square', angle: 90, orb: 7 },
  { type: 'trine', angle: 120, orb: 7 },
  { type: 'opposition', angle: 180, orb: 8 },
];

const normalize = (longitude: number) => ((longitude % 360) + 360) % 360;
const signOf = (longitude: number): SignKey => SIGN_KEYS[Math.floor(normalize(longitude) / 30) % 12]!;
const isoInstant = (at: Date): IsoInstant => at.toISOString().replace(/\.\d+Z$/, 'Z');

/**
 * Degree and minute within the sign, to the nearest minute as published charts print them. A body in the last half minute of a sign
 * stays at 29°59′ rather than show 30°00′ of a sign it has not left (Swiss Ephemeris' own SE_SPLIT_DEG_KEEP_SIGN).
 */
function withinSign(longitude: number): { degree: number; minute: number } {
  const minutes = Math.min(Math.round((normalize(longitude) % 30) * 60), 30 * 60 - 1);
  return { degree: Math.floor(minutes / 60), minute: minutes % 60 };
}

/** House 1 to 12 holding a longitude: from a cusp up to the next, going forward through the zodiac. */
export function houseOf(longitude: number, cusps: HouseCusp[]): number {
  const at = normalize(longitude);
  for (let i = 0; i < 12; i += 1) {
    const from = cusps[i]!.longitude;
    const span = normalize(cusps[(i + 1) % 12]!.longitude - from);
    if (normalize(at - from) < span) return i + 1;
  }
  return 12;
}

const toCusps = (longitudes: number[]): HouseCusp[] =>
  longitudes.map((longitude, i) => ({ house: i + 1, longitude: normalize(longitude), sign: signOf(longitude) }));

/** Twelve Whole Sign houses, the first being the whole sign that holds this longitude. */
function wholeSignCusps(longitude: number): HouseCusp[] {
  const first = Math.floor(normalize(longitude) / 30) * 30;
  return toCusps(Array.from({ length: 12 }, (_, i) => first + i * 30));
}

function planetsAt(ephemeris: Ephemeris, julianDayUt: number, cusps: HouseCusp[]): PlanetPosition[] {
  const placed = PLANET_KEYS.map((key) => ({ key, ...ephemeris.position(julianDayUt, key) }));
  return placed.map(({ key, longitude, speed }) => ({
    key,
    longitude,
    sign: signOf(longitude),
    ...withinSign(longitude),
    house: houseOf(longitude, cusps),
    speed,
    retrograde: speed < 0,
  }));
}

function angle(key: AngleKey, longitude: number): AnglePosition {
  const at = normalize(longitude);
  return { key, longitude: at, sign: signOf(at), ...withinSign(at) };
}

/** The aspect between two bodies, if there is one. Orbs never overlap, so there is at most one. */
function aspectBetween(a: PlanetPosition, b: PlanetPosition, aMoves: boolean, bMoves: boolean): ChartAspect | null {
  const signed = normalize(b.longitude - a.longitude);
  const separation = signed > 180 ? 360 - signed : signed;
  for (const { type, angle: exact, orb: allowed } of ASPECTS) {
    const off = separation - exact;
    if (Math.abs(off) > allowed) continue;
    const relative = (bMoves ? b.speed : 0) - (aMoves ? a.speed : 0);
    const separationRate = signed > 180 ? -relative : relative;
    return {
      key: `aspect:${a.key}:${type}:${b.key}`,
      a: a.key,
      b: b.key,
      type,
      orb: Math.abs(off),
      applying: off * separationRate < 0,
    };
  }
  return null;
}

const byOrb = (x: ChartAspect, y: ChartAspect) => x.orb - y.orb;

function aspectsWithin(planets: PlanetPosition[]): ChartAspect[] {
  const found: ChartAspect[] = [];
  planets.forEach((a, i) => {
    for (const b of planets.slice(i + 1)) {
      const aspect = aspectBetween(a, b, true, true);
      if (aspect) found.push(aspect);
    }
  });
  return found.sort(byOrb);
}

/** Each of `moving` against each of `fixed`, `a` always from `moving`. Same-planet pairs count: transit Saturn to natal Saturn. */
function aspectsAcross(moving: PlanetPosition[], fixed: PlanetPosition[], moves: boolean): ChartAspect[] {
  const found: ChartAspect[] = [];
  for (const a of moving) {
    for (const b of fixed) {
      const aspect = aspectBetween(a, b, moves, false);
      if (aspect) found.push(aspect);
    }
  }
  return found.sort(byOrb);
}

export async function computeChart(birth: BirthDetails): Promise<Chart> {
  const ephemeris = await loadEphemeris();
  const { place, year, month, day } = birth;
  const timeUnknown = birth.timeUnknown || birth.hour === null || birth.minute === null;
  const at = timeUnknown
    ? localToUtc(year, month, day, NOON, 0, place.timeZone)
    : localToUtc(year, month, day, birth.hour!, birth.minute!, place.timeZone);
  const julianDayUt = ephemeris.julianDayUt(at);

  let houseSystem: HouseSystem;
  let houseSystemReason: HouseSystemReason;
  let houses: HouseCusp[];
  let angles: AnglePosition[] = [];

  if (timeUnknown) {
    houseSystem = 'whole_sign';
    houseSystemReason = 'time_unknown';
    houses = wholeSignCusps(ephemeris.position(julianDayUt, 'sun').longitude);
  } else {
    const { placidusCusps, ascendant, midheaven } = ephemeris.houses(julianDayUt, place.latitude, place.longitude);
    angles = [
      angle('ascendant', ascendant),
      angle('midheaven', midheaven),
      angle('descendant', ascendant + 180),
      angle('ic', midheaven + 180),
    ];
    if (Math.abs(place.latitude) > POLAR_LATITUDE) {
      houseSystem = 'whole_sign';
      houseSystemReason = 'polar_latitude';
      houses = wholeSignCusps(ascendant);
    } else {
      houseSystem = 'placidus';
      houseSystemReason = 'chosen';
      houses = toCusps(placidusCusps);
    }
  }

  const planets = planetsAt(ephemeris, julianDayUt, houses);
  return {
    schema: 'natally.chart/v1',
    julianDayUt,
    computedAt: isoInstant(new Date()),
    houseSystem,
    houseSystemReason,
    planets,
    angles,
    houses,
    aspects: aspectsWithin(planets),
    firstHouseFrom: timeUnknown ? 'sun_sign' : 'ascendant',
  };
}

export async function computeTransits(natal: Chart, at: Date): Promise<TransitSnapshot> {
  const ephemeris = await loadEphemeris();
  const planets = planetsAt(ephemeris, ephemeris.julianDayUt(at), natal.houses);
  return { at: isoInstant(at), planets, aspectsToNatal: aspectsAcross(planets, natal.planets, true) };
}

export async function computeSynastry(self: Chart, other: BirthDetails): Promise<SynastryPair> {
  const otherChart = await computeChart(other);
  return { self, other: otherChart, otherName: other.name, crossAspects: aspectsAcross(self.planets, otherChart.planets, false) };
}

