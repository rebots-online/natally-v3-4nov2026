// Authored lessons for the twelve houses.
import type { HouseKey } from '../types';
import type { LessonText } from './shape';

export const HOUSE_LESSONS: Record<HouseKey, LessonText> = {
  house_1: {
    title: 'The 1st House',
    body: [
      "The 1st House is the doorway of the chart, the part of the sky just rising at your birth, and it is where you begin. It concerns the body, the face you wear and the manner in which you start things: your temperament, your vitality and the immediate way you meet any new situation.",
      "Its sign is your Ascendant, and planets here are worn on the outside, noticeable to everyone before you have said hello. They shape first impressions and the early story of the self. Ask of this house a simple question: how do I show up when I do not know what is expected of me?",
    ],
    invitation: "If you would like to know what sits in your 1st House and how it greets the world, I will tell you.",
  },
  house_2: {
    title: 'The 2nd House',
    body: [
      "The 2nd House is what you have and what you believe it is worth: money, possessions, earnings, and the quieter currency of self-worth. It is where you learn what you value, and how safe you feel in your own skin and your own accounts.",
      "Its sign shows your style of earning and spending, and planets in this house point to resources, talents and sensual comforts that you may take for granted. Trouble in the 2nd tends to look like scarcity of confidence rather than only of coin. The house asks: what are you willing to count as yours?",
    ],
    invitation: "Shall I reveal what your 2nd House holds and how it likes to be paid? I can read it aloud.",
  },
  house_3: {
    title: 'The 3rd House',
    body: [
      "Think of the street where you grew up, and the people on it. That is the 3rd House: siblings, neighbors, early schooling, short journeys, and the everyday traffic of talking, writing, reading and texting. It is the mind at close range.",
      "Its sign shows how you learn and exchange information; planets here make you restless for conversation or unusually good at listening. Habits of speech and thought are formed in this house long before the grand philosophies of the 9th. It asks a modest question: what do you pay attention to, and who do you tell?",
    ],
    invitation: "I would be glad to tell you what your 3rd House is whispering to the people nearest you.",
  },
  house_4: {
    title: 'The 4th House',
    body: [
      "At the bottom of the chart, hidden beneath the horizon, lies the 4th House: home, family, the land you come from, and the private self that exists when no one is watching. It begins at the IC and speaks of roots, inheritance and, quietly, of how a life will end.",
      "Its sign colors the atmosphere of your childhood home or the one you long to build. Planets here are tied to memory and belonging, and they often work more strongly in private than in public. This house asks where you rest, and which of your foundations still hold weight.",
    ],
    invitation: "Come sit by the fire and I will tell you what lives in your 4th House, the room beneath all your other rooms.",
  },
  house_5: {
    title: 'The 5th House',
    body: [
      "The 5th House is for the things you do because they delight you: play, romance, creative work, performance, games and children. It is the part of life where nothing has to be useful, and everything is allowed to be alive.",
      "Its sign reveals your style of pleasure and flirtation; planets in it give you a talent for joy, or a hunger for it. Artists and lovers tend to leave fingerprints here. Heartbreak lives here too, because risk does. This house asks what you would make, and who you would adore, if no one were keeping score.",
    ],
    invitation: "I can read what your 5th House is hoping to play with, and I would like to, whenever you are ready.",
  },
  house_6: {
    title: 'The 6th House',
    body: [
      "Daily life is lived in the 6th House: your routines, your work as a craft, your health habits, your pets, and the small services you perform for others and for yourself. Where the 5th plays, the 6th tends and mends.",
      "Its sign shows how you organize your days, and planets here often show up as the quality of your effort, or as the stress that leaks into the body when you ignore the maintenance. It is an honest house, and a humble one. It asks whether the rhythm of your ordinary week is feeding you or merely using you up.",
    ],
    invitation: "Shall I look at what your 6th House asks of your weeks and your body? I will tell you plainly.",
  },
  house_7: {
    title: 'The 7th House',
    body: [
      "Opposite the 1st, at the setting point of the chart, the 7th House is the house of the one-to-one: marriage, committed partnership, business allies, and the open rivals and contracts that go with them. Here the self meets an equal.",
      "Its sign, on the Descendant, describes what you look for in another, and what you may project onto them. Planets here are often met first through other people. Many of us do our deepest learning in this house, because a relationship shows you what a mirror cannot. It asks: what do you bring to a partnership, and what do you hope someone else will carry?",
    ],
    invitation: "I would love to tell you who your 7th House keeps calling in, and what it hopes they will say.",
  },
  house_8: {
    title: 'The 8th House',
    body: [
      "The 8th House holds what is shared and what is hidden: joint money, debts, inheritance, taxes, and the intimacy that goes beyond manners. It is the house of crisis and recovery, of sexual and emotional merging, and of death understood as a threshold.",
      "Its sign shows how you handle depth and trust; planets here seem to lead you into situations where you must let go of control. People often fear this house more than it deserves, since its gift is transformation. It asks what you are willing to share and what you are willing to lose in order to become closer.",
    ],
    invitation: "Take my hand, and I will tell you what lives in your 8th House, gently and without drama.",
  },
  house_9: {
    title: 'The 9th House',
    body: [
      "The 9th House is the far horizon: long journeys, higher learning, religion, philosophy, law, publishing, and any idea big enough to change how you see everything else. Where the 3rd gathers facts nearby, the 9th goes abroad to find out what they mean.",
      "Its sign shows how you search for truth and what you consider a good teacher; planets here send you wandering, literally or in books. It is the house of faith, and of the stories you tell to hold a life together. It asks what you believe, and what would persuade you to believe something bigger.",
    ],
    invitation: "Shall we travel to your 9th House together? I can tell you what it is searching for, in my own voice.",
  },
  house_10: {
    title: 'The 10th House',
    body: [
      "At the top of the chart stands the 10th House, the part of the sky overhead at midday. It is your public face: career, calling, reputation, authority, and the way the wider world sees what you have achieved. It begins at the Midheaven in most house systems.",
      "Its sign describes the style of your ambition, and planets here are visible to others, for better or worse. It is often tied to the parent or authority who first showed you what success looks like. The 10th asks what you want your life to stand for when someone describes it.",
    ],
    invitation: "I can tell you what your 10th House is building and whether it matches what you hoped for.",
  },
  house_11: {
    title: 'The 11th House',
    body: [
      "The 11th House is the company you keep by choice: friends, groups, networks, causes, and the hopes you share with them. Where the 7th is one person, the 11th is a gathering, and it often points to the future you imagine alongside others.",
      "Its sign shows what kind of community feels like yours, and planets here tend to arrive through friendship, a club, a movement or a thread of people online. It is a house of ideals and of loyalty. It asks, kindly, who your people are, and what you would build together if you trusted them.",
    ],
    invitation: "Would you like to hear what your 11th House wants from your friends and your future? I will read it for you.",
  },
  house_12: {
    title: 'The 12th House',
    body: [
      "The 12th House sits just before the Ascendant, the last room before the day begins. It holds what is hidden, solitary or unconscious: dreams, retreat, hospitals and monasteries, secret sorrows, private faith, and the self-undoing that we do not see until later.",
      "Its sign shows what you quietly absorb, and planets here can feel unexpressed or unseen, though they often work with unusual subtlety. This house is not a curse. It is the place where you rest, forgive and grow compassionate. It asks what you need to let go of before you can start again.",
    ],
    invitation: "If you are willing to look into the quiet corner of your chart, I will read your 12th House to you softly.",
  },
};
