// Authored lessons for the ten planets and the North Node.
import type { PlanetKey } from '../types';
import type { LessonText } from './shape';

export const PLANET_LESSONS: Record<PlanetKey, LessonText> = {
  sun: {
    title: 'The Sun',
    body: [
      "Begin with the Sun, because every other placement in your chart is read in its light. Its sign is the one people mean when they ask what you are, and it marks the center of your sense of purpose: the way you shine when nobody has told you how.",
      "The Sun crosses the whole zodiac in a year, resting about a month in each sign, which is why a birthday places it so easily. Its house shows where that vitality likes to work, and its aspects show who and what it has to negotiate with. The Sun does not describe your whole personality. It describes what you keep growing toward, even on the days you would rather not.",
    ],
    invitation: "If you would like to hear what your own Sun is doing, and how it speaks to the rest of your chart, I will read it to you aloud.",
  },
  moon: {
    title: 'The Moon',
    body: [
      "Where the Sun is who you are becoming, the Moon is what you already know in your bones. She is the body of your chart: your moods, your habits, your appetite for comfort, and the thing you reach for when you are tired and nobody is watching.",
      "She is the fastest mover in the sky, circling the zodiac in about twenty-seven days and changing sign every two days or so, so on the day you were born she may have crossed a boundary. Her sign describes how you feel safe, her house where you feel at home, and her aspects how easily your feelings are heard by the rest of you. Look to her for what soothes you and what stings.",
    ],
    invitation: "Come closer and I will tell you what your Moon needs, which is often a very different thing from what you ask for.",
  },
  mercury: {
    title: 'Mercury',
    body: [
      "Mercury is the quick one, forever carrying messages between one part of you and another. It rules how you think, speak, notice, joke, argue and learn, and the particular kind of question that keeps you awake at two in the morning.",
      "It never strays far from the Sun, at most about twenty-eight degrees, so your Mercury shares your Sun sign or sits in the sign just before or after it. Its sign shows the style of your mind: swift or deliberate, playful or exact. Its house shows what you cannot stop talking about. When Mercury is retrograde at birth, the mind often turns inward first and speaks second.",
    ],
    invitation: "Shall we listen to what your Mercury is saying beneath the words you actually use? I can read it to you.",
  },
  venus: {
    title: 'Venus',
    body: [
      "Venus is what you find beautiful and whom you find yourself drawn to. She is attraction itself, the pull toward harmony, pleasure and whatever is worth having near you. In a chart she speaks of love, but also of taste, of money, and of the way you make peace.",
      "She keeps within forty-eight degrees of the Sun, so she is never more than two signs away from it. Her sign shows how you court and how you like to be courted, her house shows where you look for delight, and her aspects show what complicates or sweetens it. Ask of Venus not whom you will love, but how you love.",
    ],
    invitation: "I would so like to tell you what your own Venus wants, and I can say it in my own voice if you will let me.",
  },
  mars: {
    title: 'Mars',
    body: [
      "Mars is your drive: the part of you that wants, that pushes, that says no when it matters and goes when everyone else hesitates. Anger lives here, and so does courage, and they are often the same fire seen from two sides.",
      "Its sign tells you how you act, whether with sudden heat, patient force or cold precision. Its house tells you where you spend your effort and where you meet resistance. Mars usually stays about two months in a sign, though a retrograde loop can stretch that to many. Honor it. A chart in which Mars is ignored is a chart with a stalled engine, and the engine will make itself heard eventually.",
    ],
    invitation: "Want to know where your Mars is pushing and where it is quietly stuck? I can tell you, aloud, from your actual chart.",
  },
  jupiter: {
    title: 'Jupiter',
    body: [
      "Jupiter is the planet of more: more room, more faith, more luck, more story than you thought your life could hold. It enlarges whatever it touches, which is a gift and occasionally a hazard.",
      "It takes about twelve years to circle the zodiac and roughly a year in each sign, so a Jupiter return arrives at twelve, twenty-four, thirty-six and onward. Its sign shows how you grow and what you believe in. Its house shows where opportunity tends to find you. Its aspects show what makes your generosity easy or excessive. Wherever Jupiter sits in your chart, you are often being asked to trust.",
    ],
    invitation: "There is a particular place in your chart where good fortune likes to gather, and I would love to show you where.",
  },
  saturn: {
    title: 'Saturn',
    body: [
      "Saturn is the great teacher, and he teaches by limit. He is time, structure, responsibility, the wall that gives a room its shape. Nobody asks for him, and later almost everybody is grateful.",
      "He needs about twenty-nine and a half years to circle the zodiac, so your first Saturn return, around the age of twenty-nine, is the famous reckoning with what you have built. His sign shows how you discipline yourself and what you fear failing at. His house shows where you work hardest and earn mastery slowly. Saturn is not a punishment. He is the part of you that keeps its promises.",
    ],
    invitation: "Let me read you the lesson your Saturn has been patiently waiting to give, gently and in plain words.",
  },
  uranus: {
    title: 'Uranus',
    body: [
      "Uranus is the lightning bolt: the sudden idea, the broken pattern, the part of you that refuses to be like everyone else. It is freedom with an edge, and it rarely announces itself politely.",
      "Because it takes about eighty-four years to circle the zodiac, spending seven in each sign, Uranus describes a generation more than a single person. What makes it yours is its house, which shows where you break from convention, and its aspects, which show how personally you feel the jolt. Look there for restlessness, invention, and the places where you reinvent yourself.",
    ],
    invitation: "I can show you exactly where in your life the lightning prefers to land, if you would like to hear it.",
  },
  neptune: {
    title: 'Neptune',
    body: [
      "Neptune is mist over water, the dissolving of edges, the longing to merge with something larger than one life. It carries imagination, compassion and music, and it also carries illusion, which is the price of the others.",
      "It crosses the zodiac in about one hundred and sixty-four years, lingering roughly fourteen in each sign, so like Uranus it marks the dream of a whole generation. In your own chart its house shows where you idealize, or where you give yourself away. Its aspects show what lends it focus. Neptune asks that you hold your vision loosely and your boundaries kindly.",
    ],
    invitation: "Stay a moment and I will tell you where your Neptune hides your wishes, and where it lets you see them.",
  },
  pluto: {
    title: 'Pluto',
    body: [
      "Pluto is what lies beneath the floorboards. It is power, compulsion, endings and the slow, total transformation that follows them: the planet of whatever must be buried so something else can come up.",
      "Its orbit is lopsided, so it spends anywhere from twelve to thirty-one years in one sign, and about two hundred and forty-eight to go around once. Its sign belongs to a generation. Its house is intimately yours: it shows where you meet intensity, where you cannot stay shallow, and where you rebuild after loss. Its aspects show what it presses against. Approach it with respect rather than fear.",
    ],
    invitation: "If you are ready for the deep end, I will read your Pluto to you carefully and without flinching.",
  },
  north_node: {
    title: 'The North Node',
    body: [
      "The North Node is not a planet but a point: the place where the Moon's path crosses the Sun's apparent path, the ecliptic, traveling northward. Astrologers read it as a direction of growth, something to practice rather than something you already do well.",
      "The South Node lies exactly opposite and holds what comes easily, and what you may lean on too hard. The Nodes move backward through the signs, about a year and a half in each, so many people share your North Node sign. Your house shows the territory where the stretching happens. Follow its sign's invitation a little at a time, and notice that the discomfort tends to be the point.",
    ],
    invitation: "Let me tell you which way your own North Node is pointing, and what the first small step might feel like.",
  },
};
