// Names used inside lesson text. The lessons layer reads only the types module, so these are kept here.
import type { AngleKey, AspectType, PlanetKey, SignKey } from '../types';

export const NAMES: Record<PlanetKey | AngleKey | SignKey | AspectType, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter',
  saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto', north_node: 'North Node',
  ascendant: 'Ascendant', midheaven: 'Midheaven', descendant: 'Descendant', ic: 'IC',
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo',
  libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagittarius', capricorn: 'Capricorn',
  aquarius: 'Aquarius', pisces: 'Pisces',
  conjunction: 'conjunction', sextile: 'sextile', square: 'square', trine: 'trine', opposition: 'opposition',
};

const SUFFIX = ['th', 'st', 'nd', 'rd'];

/** "7th". */
export const ordinal = (n: number): string => `${n}${SUFFIX[n] ?? 'th'}`;

/** "7th House". */
export const houseLabel = (n: number): string => `${ordinal(n)} House`;

/** "1 degree", "12 degrees": spoken aloud, so no symbols. */
export const degrees = (n: number): string => `${n} ${n === 1 ? 'degree' : 'degrees'}`;
