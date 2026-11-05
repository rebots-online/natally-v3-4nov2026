// Authored lessons for the four angles.
import type { AngleKey } from '../types';
import type { LessonText } from './shape';

export const ANGLE_LESSONS: Record<AngleKey, LessonText> = {
  ascendant: {
    title: 'The Ascendant',
    body: [
      "The Ascendant is the sign that was rising over the eastern horizon at the moment you were born, and it is the door through which you meet the world. People often read it in you first: your manner, your look, the way you arrive in a room. It also begins your chart, since it opens your 1st House.",
      "It moves a degree about every four minutes, so it needs your birth time to be exact. A few minutes can change the degree and about two hours changes the sign. Think of it as a first impression that slowly becomes a style of living. Planets close to it color how you come across, often before you have said a word.",
    ],
    invitation: "When you are ready, I will tell you what your rising sign is quietly announcing on your behalf.",
  },
  midheaven: {
    title: 'The Midheaven',
    body: [
      "Straight up from where you stood at birth lies the Midheaven, the highest point your chart reaches. It points to vocation and public life: what you are known for, what you are working toward, and the face you invite the world to respect. It is not a job title. It is closer to an answer to what you would like to be remembered for.",
      "It sits opposite the IC, and in Placidus houses it marks the start of your 10th House. Its sign describes the style of your ambition, whether visible or private, steady or sudden. A planet near the Midheaven tends to become part of your reputation whether you invited it or not.",
    ],
    invitation: "Would you like to hear what your Midheaven says about the work you are here to do? I can read it aloud for you.",
  },
  descendant: {
    title: 'The Descendant',
    body: [
      "Opposite the Ascendant, where the Sun sets, stands the Descendant: the doorway on the far side of the chart through which other people enter your story. It begins the 7th House and describes what you seek, and sometimes project, in partnership. We tend to admire and fall for the qualities we have not yet claimed in ourselves.",
      "It is always exactly opposite your Ascendant, the same degree in the opposite sign, so a rising Aries means a setting Libra. Read it for the shape of your close relationships: marriage, business partners, even the rivals who sharpen you. Ask what you are drawn to, then gently ask what in you it mirrors.",
    ],
    invitation: "I would love to show you who keeps walking through your Descendant door, and why they look so familiar.",
  },
  ic: {
    title: 'The IC',
    body: [
      "The IC, from the Latin Imum Coeli, the bottom of the sky, is the point directly beneath your feet at birth, opposite the Midheaven. Where the Midheaven is public, the IC is private: home, family, ancestry, the ground you stand on, and the inner room that no one else sees. It also speaks of roots and of endings.",
      "In Placidus houses it begins the 4th House. Its sign shows the atmosphere you grew up in, or the atmosphere you keep trying to rebuild. Reading it is tender work. Ask where you feel safe enough to rest, and what you inherited without anyone telling you.",
    ],
    invitation: "Sit with me for a little while, and I will read what your IC says about where you come from.",
  },
};
