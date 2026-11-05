// The chart module's text (§3.2 rule 5): frozen text of `birth-details`, the keys of §11.11, and the names of chart elements.
import type { AngleKey, AspectType, PlanetKey, SignKey } from '../types';

export const strings = {
  'birth.back': 'Back',
  'birth.cameoAlt': 'Natally holding violet crystal ball',
  'birth.heading': 'When and where were you born?',
  'birth.subheading': 'Natally calculates your chart from this.',
  'birth.submit': 'Calculate my chart',
  'birth.nameLabel': 'Your name',
  'birth.dateLabel': 'Birth date',
  'birth.timeLabel': 'Birth time',
  'birth.timeUnknownLabel': "I don't know my birth time",
  'birth.timeNote': 'Without a birth time your chart uses Whole Sign houses.',
  'birth.placeLabel': 'Birth place',
  'birth.computing': 'Calculating your chart…',
  'birth.chartFailed': "We couldn't calculate your chart. Please try again.",
  'birth.nameRequired': 'Please tell Natally what to call you.',
  'birth.dateInvalid': "That date doesn't exist.",
  'birth.timeInvalid': 'Please enter a time like 7:05 PM, or tick the box.',
  'birth.placeRequired': 'Please choose a place from the list.',
  'birth.noPlaces': 'No matching place. Try the nearest city.',
  'chart.wholeSignReason': 'Without a birth time your chart uses Whole Sign houses, counted from your Sun sign.',
  'chart.polarReason': 'Placidus cannot be drawn at this latitude, so your chart uses Whole Sign houses.',
} as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const ELEMENT_NAMES: Record<PlanetKey | AngleKey | SignKey | AspectType, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
  north_node: 'North Node',
  ascendant: 'Ascendant',
  midheaven: 'Midheaven',
  descendant: 'Descendant',
  ic: 'IC',
  aries: 'Aries',
  taurus: 'Taurus',
  gemini: 'Gemini',
  cancer: 'Cancer',
  leo: 'Leo',
  virgo: 'Virgo',
  libra: 'Libra',
  scorpio: 'Scorpio',
  sagittarius: 'Sagittarius',
  capricorn: 'Capricorn',
  aquarius: 'Aquarius',
  pisces: 'Pisces',
  conjunction: 'Conjunction',
  sextile: 'Sextile',
  square: 'Square',
  trine: 'Trine',
  opposition: 'Opposition',
};

const ORDINAL_SUFFIX = ['th', 'st', 'nd', 'rd'];

/** "7th House". */
export function houseName(house: number): string {
  return `${house}${ORDINAL_SUFFIX[house] ?? 'th'} House`;
}
