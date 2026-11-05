// The birth form's values, its text shape, and parseBirthFields (§5.8).
import type { BirthDetails, BirthPlace } from '../types';
import { MONTH_NAMES } from './strings';

export interface BirthFieldValues {
  name: string;
  /** Select values: day "8", month "November", year "1997". Empty until chosen, so no date is ever assumed. */
  day: string;
  month: string;
  year: string;
  time: string;
  timeUnknown: boolean;
  placeText: string;
  place: BirthPlace | null;
}

export interface BirthFieldErrors {
  nameRequired: string;
  dateInvalid: string;
  timeInvalid: string;
  placeRequired: string;
}

export interface BirthFieldStrings {
  nameLabel: string;
  namePlaceholder?: string;
  dateLabel: string;
  timeLabel: string;
  timePlaceholder?: string;
  timeUnknownLabel: string;
  /** The muted line under the checkbox; the synastry sheet has none. */
  timeNote: string | null;
  placeLabel: string;
  placePlaceholder?: string;
  noPlaces: string;
  errors: BirthFieldErrors;
}

export const EMPTY_BIRTH_FIELDS: BirthFieldValues = {
  name: '',
  day: '',
  month: '',
  year: '',
  time: '',
  timeUnknown: false,
  placeText: '',
  place: null,
};

export function daysInMonth(month: string, year: string): number {
  const monthNumber = MONTH_NAMES.indexOf(month as (typeof MONTH_NAMES)[number]) + 1;
  if (monthNumber === 0) return 31;
  // Until a year is chosen, 29 February stays possible (2000 is a leap year). Date.UTC treats month 12 as next January, day 0 as the day before.
  return new Date(Date.UTC(Number(year) || 2000, monthNumber, 0)).getUTCDate();
}

const TIME_PATTERN = /^(\d{1,2})(?:[:.](\d{2}))?\s*(?:([ap])\.?m?\.?)?$/i;

/** Accepts `7:05 PM`, `7 pm` and `19:05`. Minutes may only be left out with AM or PM: a bare "7" says too little. */
function parseTime(raw: string): { hour: number; minute: number } | null {
  const match = TIME_PATTERN.exec(raw.trim());
  if (!match) return null;
  const [, hourText, minuteText, meridiem] = match;
  if (minuteText === undefined && !meridiem) return null;
  const minute = minuteText === undefined ? 0 : Number(minuteText);
  let hour = Number(hourText);
  if (minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (meridiem.toLowerCase() === 'p' ? 12 : 0);
  } else if (hour > 23) {
    return null;
  }
  return { hour, minute };
}

export function parseBirthFields(v: BirthFieldValues): { birth: BirthDetails } | { error: keyof BirthFieldErrors } {
  const name = v.name.trim();
  if (!name) return { error: 'nameRequired' };

  const month = MONTH_NAMES.indexOf(v.month as (typeof MONTH_NAMES)[number]) + 1;
  const year = Number(v.year);
  const day = Number(v.day);
  if (month === 0 || !v.year || !Number.isInteger(day) || day < 1 || day > daysInMonth(v.month, v.year)) return { error: 'dateInvalid' };

  const time = v.timeUnknown ? null : parseTime(v.time);
  if (!v.timeUnknown && !time) return { error: 'timeInvalid' };

  if (!v.place) return { error: 'placeRequired' };

  return {
    birth: {
      name,
      year,
      month,
      day,
      hour: time ? time.hour : null,
      minute: time ? time.minute : null,
      timeUnknown: v.timeUnknown,
      place: v.place,
    },
  };
}
