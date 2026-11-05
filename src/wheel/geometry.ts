// Wheel layout shared by the 3D wheel and the flat wheel. Coordinates are wheel units: outer ring radius 1, y up,
// angles counter-clockwise from three o'clock, ascendant at nine o'clock.
import { ANGLE_KEYS, HOUSE_KEYS, PLANET_KEYS, SIGN_KEYS, type AngleKey, type AspectInstanceKey, type Chart, type ChartAspect, type ChartElementKey, type HouseKey, type PlanetKey, type SignKey } from '../types';
import { strings } from './strings';

export const RADIUS = { outer: 1, signInner: 0.87, signGlyph: 0.935, houseInner: 0.7, houseMid: 0.785, hub: 0.28 };
const PLANET_LEVELS = [0.61, 0.51, 0.41];
const CROWDED_DEGREES = 8;
const PLANET_PICK = 0.09;
const ANGLE_PICK = 0.075;

const norm360 = (deg: number) => ((deg % 360) + 360) % 360;

export interface Plot { x: number; y: number; r: number; theta: number; }

export const polar = (r: number, theta: number): Plot => ({ x: r * Math.cos(theta), y: r * Math.sin(theta), r, theta });

/** The longitude drawn at nine o'clock: the ascendant, or the first house cusp when the time is unknown. */
export function anchorLongitude(chart: Chart): number {
  return chart.angles.find((a) => a.key === 'ascendant')?.longitude ?? chart.houses[0]!.longitude;
}

export function wheelAngle(longitude: number, anchor: number): number {
  return Math.PI + (norm360(longitude - anchor) * Math.PI) / 180;
}

function longitudeAt(theta: number, anchor: number): number {
  return norm360(anchor + ((theta - Math.PI) * 180) / Math.PI);
}

/** Where each planet sits: crowded neighbours step inward so spheres and glyphs do not overlap. */
export function planetPlots(chart: Chart): Map<PlanetKey, Plot> {
  const anchor = anchorLongitude(chart);
  const sorted = [...chart.planets].sort((a, b) => a.longitude - b.longitude);
  let widest = 0;
  let start = 0;
  sorted.forEach((p, i) => {
    const gap = norm360(p.longitude - sorted[(i + sorted.length - 1) % sorted.length]!.longitude);
    if (gap > widest) { widest = gap; start = i; }
  });
  const plots = new Map<PlanetKey, Plot>();
  let level = 0;
  for (let n = 0; n < sorted.length; n++) {
    const planet = sorted[(start + n) % sorted.length]!;
    const previous = sorted[(start + n + sorted.length - 1) % sorted.length]!;
    level = n > 0 && norm360(planet.longitude - previous.longitude) < CROWDED_DEGREES ? (level + 1) % PLANET_LEVELS.length : 0;
    plots.set(planet.key, polar(PLANET_LEVELS[level]!, wheelAngle(planet.longitude, anchor)));
  }
  return plots;
}

/** The start angle and sweep of a sign's band segment. */
export function signArc(index: number, anchor: number): { start: number; sweep: number } {
  return { start: wheelAngle(index * 30, anchor), sweep: Math.PI / 6 };
}

/** The start angle and sweep of a house sector; house is 1 to 12. */
export function houseArc(chart: Chart, house: number, anchor: number): { start: number; sweep: number } {
  const from = houseCusp(chart, house);
  const to = houseCusp(chart, (house % 12) + 1);
  return { start: wheelAngle(from, anchor), sweep: (norm360(to - from) * Math.PI) / 180 };
}

function houseCusp(chart: Chart, house: number): number {
  return chart.houses.find((h) => h.house === house)!.longitude;
}

function houseAtLongitude(chart: Chart, longitude: number): number {
  for (let house = 1; house <= 12; house++) {
    const from = houseCusp(chart, house);
    const to = houseCusp(chart, (house % 12) + 1);
    if (norm360(longitude - from) < norm360(to - from)) return house;
  }
  return 1;
}

/** What sits at a point of the wheel: planet, then angle, then sign, then house sector. Aspects are lit, not picked (§9.3). */
export function pickAt(chart: Chart, plots: Map<PlanetKey, Plot>, x: number, y: number): ChartElementKey | null {
  let best: PlanetKey | null = null;
  let bestDistance = PLANET_PICK;
  for (const [key, plot] of plots) {
    const distance = Math.hypot(plot.x - x, plot.y - y);
    if (distance < bestDistance) { bestDistance = distance; best = key; }
  }
  if (best) return best;
  const anchor = anchorLongitude(chart);
  for (const angle of chart.angles) {
    const mark = polar(RADIUS.houseMid, wheelAngle(angle.longitude, anchor));
    if (Math.hypot(mark.x - x, mark.y - y) < ANGLE_PICK) return angle.key;
  }
  const r = Math.hypot(x, y);
  if (r > RADIUS.outer || r < RADIUS.hub) return null;
  const longitude = longitudeAt(Math.atan2(y, x), anchor);
  if (r >= RADIUS.signInner) return SIGN_KEYS[Math.floor(longitude / 30) % 12]!;
  return HOUSE_KEYS[houseAtLongitude(chart, longitude) - 1]!;
}

export type ParsedKey =
  | { kind: 'planet'; key: PlanetKey }
  | { kind: 'angle'; key: AngleKey }
  | { kind: 'sign'; key: SignKey; index: number }
  | { kind: 'house'; key: HouseKey; house: number }
  | { kind: 'aspect'; key: AspectInstanceKey; aspect: ChartAspect };

/** Resolves a key against this chart; null when the chart does not hold it (an angle with no birth time, an absent aspect). */
export function parseKey(chart: Chart, key: ChartElementKey | null): ParsedKey | null {
  if (!key) return null;
  if (key.startsWith('aspect:')) {
    const aspect = chart.aspects.find((a) => a.key === key);
    return aspect ? { kind: 'aspect', key: key as AspectInstanceKey, aspect } : null;
  }
  if ((PLANET_KEYS as readonly string[]).includes(key)) return chart.planets.some((p) => p.key === key) ? { kind: 'planet', key: key as PlanetKey } : null;
  if ((ANGLE_KEYS as readonly string[]).includes(key)) return chart.angles.some((a) => a.key === key) ? { kind: 'angle', key: key as AngleKey } : null;
  const signIndex = (SIGN_KEYS as readonly string[]).indexOf(key);
  if (signIndex >= 0) return { kind: 'sign', key: key as SignKey, index: signIndex };
  const houseIndex = (HOUSE_KEYS as readonly string[]).indexOf(key);
  return houseIndex >= 0 ? { kind: 'house', key: key as HouseKey, house: houseIndex + 1 } : null;
}

/** The ids that stay lit for a highlight: the element itself, both planets of an aspect, both cusps of a house. */
export function litIds(parsed: ParsedKey | null): Set<string> | null {
  if (!parsed) return null;
  if (parsed.kind === 'aspect') return new Set([parsed.key, parsed.aspect.a, parsed.aspect.b]);
  if (parsed.kind === 'house') return new Set([parsed.key, HOUSE_KEYS[parsed.house % 12]!]);
  return new Set([parsed.key]);
}

/** The name beside a lit placement, without its glyph. */
export function labelFor(parsed: ParsedKey): string {
  switch (parsed.kind) {
    case 'planet': return strings.planets[parsed.key];
    case 'angle': return strings.angles[parsed.key];
    case 'sign': return strings.signs[parsed.key];
    case 'house': return strings.house(parsed.house);
    case 'aspect': return `${strings.planets[parsed.aspect.a]} ${strings.aspects[parsed.aspect.type]} ${strings.planets[parsed.aspect.b]}`;
  }
}

export interface LabelSpot { x: number; y: number; offset: number; }

/** Where the label of a lit placement sits; `offset` pushes it to the right of a marker so it clears the halo. */
export function labelSpot(chart: Chart, plots: Map<PlanetKey, Plot>, parsed: ParsedKey): LabelSpot {
  const anchor = anchorLongitude(chart);
  switch (parsed.kind) {
    case 'planet': {
      const plot = plots.get(parsed.key)!;
      return { x: plot.x, y: plot.y, offset: 0.095 };
    }
    case 'angle': {
      const mark = polar(RADIUS.houseMid, wheelAngle(chart.angles.find((a) => a.key === parsed.key)!.longitude, anchor));
      return { x: mark.x, y: mark.y, offset: 0.06 };
    }
    case 'sign': {
      const arc = signArc(parsed.index, anchor);
      const spot = polar(RADIUS.houseMid, arc.start + arc.sweep / 2);
      return { x: spot.x, y: spot.y, offset: 0 };
    }
    case 'house': {
      const arc = houseArc(chart, parsed.house, anchor);
      const spot = polar(RADIUS.houseInner - 0.06, arc.start + arc.sweep / 2);
      return { x: spot.x, y: spot.y, offset: 0 };
    }
    case 'aspect': {
      const a = plots.get(parsed.aspect.a)!;
      const b = plots.get(parsed.aspect.b)!;
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, offset: 0 };
    }
  }
}
