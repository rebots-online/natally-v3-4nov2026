// Authored lessons for the twelve signs.
import type { SignKey } from '../types';
import type { LessonText } from './shape';

export const SIGN_LESSONS: Record<SignKey, LessonText> = {
  aries: {
    title: 'Aries',
    body: [
      "Aries is the first sign, the spark at the spring equinox, when the Sun crosses the celestial equator heading north and the year begins again. It is cardinal fire, ruled by Mars, and it does what a beginning does: it moves before it is sure. Courage, directness and a clean hunger to try are its gifts.",
      "In a chart, Aries shows where you act first and think afterward, and where you refuse to wait for permission. Its shadow is impatience, and a temper that burns hot and passes fast. Planets in Aries take on its urgency; they want to be used now. The question this sign always asks is simple: what would you do if you were not afraid of going first?",
    ],
    invitation: "If any of your planets live in Aries, I can tell you what they are in such a hurry to do.",
  },
  taurus: {
    title: 'Taurus',
    body: [
      "Taurus slows the zodiac down. After the sprint of Aries comes the field, the table, the long afternoon: fixed earth, ruled by Venus, devoted to whatever can be touched, tasted and kept. It is the sign of the senses and of the things that last.",
      "Planets in Taurus become steadier and more stubborn, and they want proof in the body before they believe anything. Here you find a gift for patience, for building value, and for loving slowly and completely. The shadow is inertia, a grip on comfort that is too tight. Taurus asks what you would keep if you could keep only what you truly love.",
    ],
    invitation: "Let me tell you what the Taurus in your chart wants to hold on to, and what it is ready to put down.",
  },
  gemini: {
    title: 'Gemini',
    body: [
      "Gemini is the sign of the twins, and it never has only one thing to say. Mutable air, ruled by Mercury, it lives on curiosity: the question behind the question, the joke behind the argument, the news from three directions at once.",
      "Planets in Gemini become talkative, adaptable and quick to see both sides, sometimes to the point of dizziness. This is the sign of language, of siblings and neighbors, of the thousand small exchanges that make a day. Its gift is lightness of mind. Its shadow is scattering. Gemini asks what you would learn if you stayed with one idea until it surprised you.",
    ],
    invitation: "I would love to follow your Gemini placements wherever they wander and report what they find.",
  },
  cancer: {
    title: 'Cancer',
    body: [
      "Cancer begins at the summer solstice, the longest day of the northern year, and from that moment the light starts to shorten: fitting, for a sign so concerned with shelter. It is cardinal water, ruled by the Moon, and it feels first and explains afterward.",
      "Planets in Cancer grow protective and tidal; they remember everything and are moved by the smallest kindness. This is the sign of home, of family, of feeding the people you love. Its gift is a deep, almost animal tenderness. Its shadow is the shell that closes too fast. Cancer asks who has permission to see you without your armour.",
    ],
    invitation: "Whatever your Cancer placements are guarding, I can tell you, softly and in my own voice.",
  },
  leo: {
    title: 'Leo',
    body: [
      "Leo is the Sun's own sign, fixed fire at the height of summer, and it carries itself as though a spotlight were already on. Warm, loyal and theatrical, Leo is the sign of the heart, of play, of creative pride and of being seen for exactly what you are.",
      "Planets in Leo want to give generously and be appreciated for it, and they usually do both with style. The gift is radiance and a large, forgiving courage. The shadow is the need for applause, which can sour into wounded pride. Leo asks something plain and difficult: can you let yourself be loved without having to perform?",
    ],
    invitation: "I would be delighted to tell you where your Leo placements long to shine, if you would like to hear it.",
  },
  virgo: {
    title: 'Virgo',
    body: [
      "Virgo arrives with the harvest, and it is the sign of sorting what is useful from what is merely plentiful. Mutable earth, ruled by Mercury, it loves craft, health, routine and the satisfaction of a thing done exactly right.",
      "Planets in Virgo become discerning, modest and relentlessly observant; they notice the loose thread before anyone else does. The gift is service, skill and a quiet, dependable care. The shadow is a critic who is hardest on its owner. Virgo is often misread as cold, when it is really tenderness expressed through attention. Virgo asks whether good enough might sometimes be a kind of grace.",
    ],
    invitation: "Shall I show you what your Virgo placements have been quietly noticing about your life?",
  },
  libra: {
    title: 'Libra',
    body: [
      "Libra starts at the autumn equinox, when day and night stand equal, and its symbol is the scales, the only thing among the signs that is not a living creature. Cardinal air, ruled by Venus, it seeks balance, beauty and fairness, usually through another person.",
      "Planets in Libra turn toward partnership, diplomacy and the grace of a well-made thing. They hate to be rude and often hate to choose. The gift is a genuine ear for the other side of the story. The shadow is a peace bought by saying nothing. Libra asks what justice would look like if you were included in it.",
    ],
    invitation: "Stay with me and I will tell you what your Libra placements weigh, and what they have already decided.",
  },
  scorpio: {
    title: 'Scorpio',
    body: [
      "Scorpio is the sign that does not look away. Fixed water, ruled by Mars in the old tradition and Pluto in the modern, it goes down where others stay on the surface: into desire, secrecy, loss, power, and the strange renewal that follows them.",
      "Planets in Scorpio gain depth, focus and a talent for sensing what is unsaid. They are loyal to a fault and slow to forgive, and they would rather feel intensely than not at all. The gift is transformation. The shadow is control, or a long memory for hurt. Scorpio asks what you might become if you stopped guarding the door.",
    ],
    invitation: "If you are brave enough to hear it, I will tell you what your Scorpio placements know.",
  },
  sagittarius: {
    title: 'Sagittarius',
    body: [
      "Sagittarius is the archer who is also a horse, a centaur with its eyes on the far horizon. Mutable fire, ruled by Jupiter, it is the sign of travel, philosophy, humour and the faith that life means something worth chasing.",
      "Planets in Sagittarius become generous, frank and restless, easily bored by the small and eager for the whole picture. The gift is optimism and an appetite for meaning. The shadow is bluntness, overpromising, and the next adventure arriving before this one is finished. Sagittarius asks where you would go if you trusted the road to hold you.",
    ],
    invitation: "Shall I aim your Sagittarius placements at something specific, and tell you what I see?",
  },
  capricorn: {
    title: 'Capricorn',
    body: [
      "Capricorn begins at the winter solstice, in the dark of the year, and builds from there. Cardinal earth, ruled by Saturn, drawn as a sea-goat that climbs and swims, it is the sign of ambition, discipline and a patience most of us only admire from afar.",
      "Planets in Capricorn become serious, capable and surprisingly dry-witted; they plan in decades and trust what has been tested. The gift is endurance and a talent for turning intention into structure. The shadow is a heart held in reserve, work mistaken for worth. Capricorn asks what the summit is for, and who will be waiting there.",
    ],
    invitation: "I can tell you what your Capricorn placements are building, and what they have been too busy to enjoy.",
  },
  aquarius: {
    title: 'Aquarius',
    body: [
      "Aquarius carries a jug of water yet belongs to air, and that small paradox is the whole sign: ideas poured out for everyone. Fixed air, ruled by Saturn in the old tradition and Uranus in the modern, it is independent, inventive, humane and a little detached.",
      "Planets in Aquarius look at life from slightly above, and they care about the group, the future and the principle at stake. The gift is originality and loyalty to what is fair. The shadow is a cool distance that can feel like absence. Aquarius asks how you can belong to people without shrinking yourself to fit.",
    ],
    invitation: "If you would like to hear what your Aquarius placements imagine for the future, I will read it to you.",
  },
  pisces: {
    title: 'Pisces',
    body: [
      "Pisces is the last sign, two fish tied together and swimming in opposite directions, and it holds something of every sign before it. Mutable water, ruled by Jupiter in the old tradition and Neptune in the modern, it is the sign of compassion, dream, music and the porous heart.",
      "Planets in Pisces soak up the feeling of a room, and they translate it into art, tenderness or escape. The gift is imagination and a boundless sympathy. The shadow is a haze in which the self goes missing. Pisces asks what you might make of everything you feel, if you gave it a shape.",
    ],
    invitation: "Let me tell you what the Pisces in your chart is dreaming, and where it wishes to be met.",
  },
};
