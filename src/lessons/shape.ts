// Shared shape of the authored lesson text. Glyphs come from the types module, so only prose is written per subject.
import type { Lesson } from '../types';

export type LessonText = Pick<Lesson, 'title' | 'body' | 'invitation'>;
