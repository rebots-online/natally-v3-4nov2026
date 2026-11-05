// User-facing text of the wheel (§3.2 rule 5): the accessible name and the label beside a lit placement.
import type { AngleKey, AspectType, PlanetKey, SignKey } from '../types';

const planets: Record<PlanetKey, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter',
  saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto', north_node: 'North Node',
};
const angles: Record<AngleKey, string> = { ascendant: 'Ascendant', midheaven: 'Midheaven', descendant: 'Descendant', ic: 'IC' };
const signs: Record<SignKey, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo',
  libra: 'Libra', scorpio: 'Scorpio', sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
};
const aspects: Record<AspectType, string> = { conjunction: 'Conjunction', sextile: 'Sextile', square: 'Square', trine: 'Trine', opposition: 'Opposition' };
const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

export const strings = {
  planets,
  angles,
  signs,
  aspects,
  house: (n: number) => `${ordinals[n - 1]} House`,
  'wheel.label': 'Natal chart wheel',
  'wheel.labelLit': (name: string) => `Natal chart wheel, showing ${name}`,
};
