// Astrological glyphs, the only source (§3.2 rule 6). Each is followed by U+FE0E, so it never renders as a colour emoji.
// Every symbol is in public/fonts/NatallySymbols*.woff2. Angles have no symbol: the frozen screens mark them with letters.
import type { AngleKey, AspectType, PlanetKey, SignKey } from './index';

const T = '\uFE0E';

export const GLYPHS: Record<PlanetKey | AngleKey | SignKey | AspectType, string> = {
  sun: '\u2609' + T,
  moon: '\u263D' + T,
  mercury: '\u263F' + T,
  venus: '\u2640' + T,
  mars: '\u2642' + T,
  jupiter: '\u2643' + T,
  saturn: '\u2644' + T,
  uranus: '\u2645' + T,
  neptune: '\u2646' + T,
  pluto: '\u2647' + T,
  north_node: '\u260A' + T,
  ascendant: 'ASC' + T,
  midheaven: 'MC' + T,
  descendant: 'DSC' + T,
  ic: 'IC' + T,
  aries: '\u2648' + T,
  taurus: '\u2649' + T,
  gemini: '\u264A' + T,
  cancer: '\u264B' + T,
  leo: '\u264C' + T,
  virgo: '\u264D' + T,
  libra: '\u264E' + T,
  scorpio: '\u264F' + T,
  sagittarius: '\u2650' + T,
  capricorn: '\u2651' + T,
  aquarius: '\u2652' + T,
  pisces: '\u2653' + T,
  conjunction: '\u260C' + T,
  sextile: '\u26B9' + T,
  square: '\u25A1' + T,
  trine: '\u25B3' + T,
  opposition: '\u260D' + T,
};
