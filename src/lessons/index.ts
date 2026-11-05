// The lessons module's only public door (§5.9). Synchronous, bundled, never a model.
import {
  ANGLE_KEYS,
  ASPECT_TYPES,
  GLYPHS,
  HOUSE_KEYS,
  PLANET_KEYS,
  SIGN_KEYS,
  type Lesson,
  type LessonKey,
} from '../types';
import { ANGLE_LESSONS } from './angles';
import { ASPECT_LESSONS } from './aspects';
import { HOUSE_LESSONS } from './houses';
import { PLANET_LESSONS } from './planets';
import type { LessonText } from './shape';
import { SIGN_LESSONS } from './signs';

export { youAndElement } from './you';

const TEXT: Record<LessonKey, LessonText> = {
  ...PLANET_LESSONS,
  ...ANGLE_LESSONS,
  ...SIGN_LESSONS,
  ...HOUSE_LESSONS,
  ...ASPECT_LESSONS,
};

const has = (list: readonly string[], key: string) => list.includes(key);

/** Planets, angles, signs and aspects have a symbol. A house has none (§3.2 rule 6), so it carries its number. */
function glyphOf(key: LessonKey): string {
  if (has(HOUSE_KEYS, key)) return String(HOUSE_KEYS.indexOf(key as (typeof HOUSE_KEYS)[number]) + 1);
  if (has(PLANET_KEYS, key) || has(ANGLE_KEYS, key) || has(SIGN_KEYS, key) || has(ASPECT_TYPES, key)) {
    return GLYPHS[key as keyof typeof GLYPHS];
  }
  return '';
}

export function getLesson(key: LessonKey): Lesson {
  const text = TEXT[key];
  return { key, title: text.title, glyph: glyphOf(key), body: text.body, invitation: text.invitation };
}
