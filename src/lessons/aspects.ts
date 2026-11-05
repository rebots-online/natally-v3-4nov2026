// Authored lessons for the five aspects.
import type { AspectType } from '../types';
import type { LessonText } from './shape';

export const ASPECT_LESSONS: Record<AspectType, LessonText> = {
  conjunction: {
    title: 'The Conjunction',
    body: [
      "A conjunction is two planets standing in the same place, within about eight degrees of each other. They fuse. Neither can act without the other, so their meanings blend into a single, concentrated voice that is usually hard to separate into parts.",
      "That makes a conjunction powerful, and sometimes blind: you may not see the pair as two things at all. Whether it feels easy depends on the planets involved, for the Sun and Venus are friendly and Mars and Saturn argue. Treat a conjunction as a strong signature in your chart. Look first at which planet is faster, because it is the one doing the moving.",
    ],
    invitation: "I can tell you which conjunctions in your chart speak with one voice, and what that voice is saying.",
  },
  sextile: {
    title: 'The Sextile',
    body: [
      "A sextile joins two planets sixty degrees apart, a sixth of the circle, in signs that get along: fire with air, or earth with water. It is an aspect of opportunity, a door that is slightly open and wants a hand to push it.",
      "The effect is gentle, helpful and easy to miss, because nothing forces you to use it. Talents carried by a sextile often turn into skills only after you practice them. The orb is narrower than for the hard aspects, about five degrees. This is the friendly collaboration of your chart, and it grows with attention.",
    ],
    invitation: "Shall I show you which sextiles in your chart are waiting to be used? I will read them to you.",
  },
  square: {
    title: 'The Square',
    body: [
      "A square is two planets ninety degrees apart, a quarter of the circle, usually in signs of the same mode that want incompatible things. It is friction, and friction produces heat. Squares are the aspects most likely to feel like a problem and most likely to produce growth.",
      "A square asks to be worked on, and it rewards effort with real strength: the person with no squares has few reasons to move. Look to the houses involved to see where the tension plays out. Squares become less a conflict and more a motor once you stop expecting them to resolve and start letting them drive you.",
    ],
    invitation: "I would like to tell you where the friction in your chart is, and what it has been asking of you.",
  },
  trine: {
    title: 'The Trine',
    body: [
      "A trine joins two planets a third of the circle apart, one hundred and twenty degrees, in signs of the same element: two fires, two earths, two airs or two waters. They speak the same language, and so energy moves between them freely.",
      "This is the aspect of natural talent. What a trine gives you comes so easily that you may hardly notice you have it, and for the same reason it can sit unused. Comfort is its shadow. The question a trine asks is quite specific: what gift is so familiar to you that you have never thought to offer it?",
    ],
    invitation: "I can point out the gifts your trines are carrying, the ones you may have mistaken for ordinary, if you would like to hear them.",
  },
  opposition: {
    title: 'The Opposition',
    body: [
      "An opposition places two planets half the circle apart, one hundred and eighty degrees, facing each other across the chart like two ends of a seesaw. Each side pulls, and you tend to live one side while meeting the other in somebody else.",
      "The cure is awareness rather than victory. Oppositions ask that you hold both poles, and they tend to be felt most clearly in relationships, where the missing half walks in wearing a stranger's face. Look at the signs and houses at each end to see what exactly is being balanced. The point is not to choose one, but to hold the tension until it becomes a bridge.",
    ],
    invitation: "Let me read the two sides of your own oppositions to you, and tell you how they might meet.",
  },
};
