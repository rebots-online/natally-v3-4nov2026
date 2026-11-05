// listChartElements, elementView, parseElementKey (§5.8).
import {
  ANGLE_KEYS,
  ASPECT_TYPES,
  GLYPHS,
  HOUSE_KEYS,
  PLANET_KEYS,
  SIGN_KEYS,
  type AngleKey,
  type AspectInstanceKey,
  type AspectType,
  type Chart,
  type ChartElementKey,
  type ChartElementView,
  type HouseKey,
  type PlanetKey,
  type SignKey,
} from '../types';
import { houseOf } from './compute';
import { ELEMENT_NAMES, houseName } from './strings';

const isPlanet = (raw: string): raw is PlanetKey => (PLANET_KEYS as readonly string[]).includes(raw);
const isAngle = (raw: string): raw is AngleKey => (ANGLE_KEYS as readonly string[]).includes(raw);
const isSign = (raw: string): raw is SignKey => (SIGN_KEYS as readonly string[]).includes(raw);
const isHouse = (raw: string): raw is HouseKey => (HOUSE_KEYS as readonly string[]).includes(raw);
const isAspectType = (raw: string): raw is AspectType => (ASPECT_TYPES as readonly string[]).includes(raw);

export function parseElementKey(raw: string): ChartElementKey | null {
  if (isPlanet(raw) || isAngle(raw) || isSign(raw) || isHouse(raw)) return raw;
  const [tag, a, type, b, ...rest] = raw.split(':');
  if (tag !== 'aspect' || rest.length > 0 || !a || !type || !b) return null;
  if (!isPlanet(a) || !isPlanet(b) || !isAspectType(type)) return null;
  if (PLANET_KEYS.indexOf(a) >= PLANET_KEYS.indexOf(b)) return null;
  return raw as AspectInstanceKey;
}

export function elementView(chart: Chart, key: ChartElementKey): ChartElementView {
  if (isPlanet(key)) {
    const planet = chart.planets.find((p) => p.key === key);
    const name = ELEMENT_NAMES[key];
    return {
      key,
      kind: 'planet',
      lessonKey: key,
      glyph: GLYPHS[key],
      name,
      optionLabel: planet ? `${name} in ${ELEMENT_NAMES[planet.sign]} (${houseName(planet.house)})` : name,
    };
  }
  if (isAngle(key)) {
    const position = chart.angles.find((a) => a.key === key);
    const name = ELEMENT_NAMES[key];
    return {
      key,
      kind: 'angle',
      lessonKey: key,
      glyph: GLYPHS[key],
      name,
      optionLabel: position
        ? `${name} in ${ELEMENT_NAMES[position.sign]} (${houseName(houseOf(position.longitude, chart.houses))})`
        : name,
    };
  }
  if (isSign(key)) {
    const name = ELEMENT_NAMES[key];
    return { key, kind: 'sign', lessonKey: key, glyph: GLYPHS[key], name, optionLabel: name };
  }
  if (isHouse(key)) {
    const number = HOUSE_KEYS.indexOf(key) + 1;
    const cusp = chart.houses[number - 1];
    const name = houseName(number);
    // A house has no symbol of its own (§3.2 rule 6); it carries the sign on its cusp.
    return { key, kind: 'house', lessonKey: key, glyph: cusp ? GLYPHS[cusp.sign] : '', name, optionLabel: name };
  }
  const [, a, type, b] = key.split(':') as [string, PlanetKey, AspectType, PlanetKey];
  const name = `${ELEMENT_NAMES[a]} ${ELEMENT_NAMES[type]} ${ELEMENT_NAMES[b]}`;
  return { key, kind: 'aspect', lessonKey: type, glyph: GLYPHS[type], name, optionLabel: name };
}

export function listChartElements(chart: Chart): ChartElementView[] {
  const keys: ChartElementKey[] = [
    ...chart.planets.map((p) => p.key),
    ...chart.angles.map((a) => a.key),
    ...HOUSE_KEYS,
    ...chart.aspects.map((a) => a.key),
  ];
  return keys.map((key) => elementView(chart, key));
}
