// Licence pages of §17.4: the obligations each thing in the app carries, in the words we owe the customer.
// The OFL files and the package list are fetched by `LegalLive.tsx`; this file holds the authored text around them.
import type { LegalDocument, LegalParty } from './types';

export type LicenceKey = 'swisseph' | 'voice' | 'fonts' | 'notices';

export function swissEphemeris({ app, entity, email }: LegalParty): LegalDocument {
  return {
    title: 'Swiss Ephemeris',
    sections: [
      {
        heading: 'What it does here',
        blocks: [
          `${app} calculates the positions of the Sun, Moon, planets and points in your chart with the Swiss Ephemeris, run on your own device as a WebAssembly build, from the birth date, time and place you give. Houses are Placidus, or Whole Sign where there is no birth time or Placidus cannot be drawn.`,
        ],
      },
      {
        heading: 'Attribution',
        blocks: [
          `Swiss Ephemeris, copyright Astrodienst AG, Zurich, Switzerland. The ephemeris is built on the planetary and lunar ephemerides of the NASA Jet Propulsion Laboratory and on the work of Dieter Koch and Alois Treindl.`,
        ],
      },
      {
        heading: 'Licence',
        blocks: [
          `The Swiss Ephemeris is dual licensed by Astrodienst AG. ${app} uses it under the GNU Affero General Public License, version 3, which is the open-source route, and publishes its own source code under the same licence, GNU AGPL version 3 only. Everything that ${app} does with the library is therefore open to you.`,
          `Source code: you are entitled to the complete corresponding source code of this app, as it is running now, for free. It is offered to every person who uses it over a network, as the licence requires. To receive it, write to ${email} and ${entity} will send it to you or tell you where to download it.`,
          `The full text of the GNU Affero General Public License, version 3, is at https://www.gnu.org/licenses/agpl-3.0.html and applies to the library and to the app.`,
        ],
      },
    ],
  };
}

/** The Attachment A use restrictions of BigScience OpenRAIL-M, which must be passed on to everyone who receives the model or its output tools. */
const OPENRAIL_RESTRICTIONS = [
  'in any way that violates any applicable national, federal, state, local or international law or regulation;',
  'for the purpose of exploiting, harming or attempting to exploit or harm minors in any way;',
  'to generate or disseminate verifiably false information with the purpose of harming others;',
  'to generate or disseminate personal identifiable information that can be used to harm an individual;',
  'to generate or disseminate information or content, in any context (for example posts, articles, tweets, chatbots or other kinds of automated bots), without expressly and intelligibly disclaiming that the text is machine generated;',
  'to defame, disparage or otherwise harass others;',
  'to impersonate or attempt to impersonate others without their consent;',
  "for fully automated decision making that adversely impacts an individual's legal rights or otherwise creates or modifies a binding, enforceable obligation;",
  'for any use intended to or which has the effect of discriminating against or harming individuals or groups based on online or offline social behavior or known or predicted personal or personality characteristics;',
  'to exploit any of the vulnerabilities of a specific group of persons based on their age, social, physical or mental characteristics, in order to materially distort the behavior of a person pertaining to that group in a manner that causes or is likely to cause that person or another person physical or psychological harm;',
  'for any use intended to or which has the effect of discriminating against individuals or groups based on legally protected characteristics or categories;',
  'to provide medical advice and medical results interpretation;',
  'to generate or disseminate information for the purpose to be used for administration of justice, law enforcement, immigration or asylum processes, such as predicting an individual will commit fraud or crime commercially or otherwise.',
];

export function supertonicVoice({ app, entity, email }: LegalParty): LegalDocument {
  return {
    title: 'Supertonic voice model',
    sections: [
      {
        heading: 'Her voice is machine generated',
        blocks: [
          `${app} speaks with Supertonic, a text-to-speech model published by Supertone Inc., in the ONNX form made available for browsers. The model is downloaded once to your device and runs there. What you hear is synthetic speech. It is not a recording of a person, and no one should be led to think it is.`,
        ],
      },
      {
        heading: 'Licence',
        blocks: [
          `The model is released under the BigScience Open RAIL-M licence (Responsible AI License with Model terms). The licence lets you use, copy and share the model, and it requires the use restrictions below to be passed on to anyone who receives it or a derivative. They bind ${entity} and they bind you if you reuse the model or what it produces outside ${app}.`,
          `You agree not to use the model or its derivatives:`,
          OPENRAIL_RESTRICTIONS,
          `The complete licence text is published with the model: see the link below. The text above is a plain copy of its use restrictions, which are the terms that must travel with the model; where the two differ, the published licence text governs.`,
        ],
      },
      {
        heading: 'Machine-generated disclosure',
        blocks: [
          `In keeping with the restriction on machine-generated content, ${app} tells you here, on the About screen and in its Terms that its voice is machine generated. If you share a recording or a transcript of that voice, say so too.`,
          `Questions about this licence: ${email}.`,
        ],
      },
    ],
  };
}

export function fontLicences({ app }: LegalParty): LegalDocument {
  return {
    title: 'Fonts',
    sections: [
      {
        heading: 'Typefaces used by the app',
        blocks: [
          `${app} sets its text in Fraunces, Cinzel, Nunito Sans and JetBrains Mono, and draws its astrological glyphs from subsets of Noto Sans Symbols and Noto Sans Symbols 2. All of them are licensed under the SIL Open Font License, version 1.1. They are served from the app's own folder, not from a font service, so no font request leaves your device for another site.`,
          `The licence file of each family follows exactly as it is distributed with the font.`,
        ],
      },
    ],
  };
}

export function openSourceNotices({ app, entity, email }: LegalParty): LegalDocument {
  return {
    title: 'Open source notices',
    sections: [
      {
        heading: `${app} itself`,
        blocks: [
          `The source code of ${app} is published under the GNU Affero General Public License, version 3 only. If you use ${app} over a network you may receive its complete corresponding source code for free: write to ${email} and ${entity} will send it, or tell you where to download it. The ${app} name, characters, pictures and sounds are not part of that licence and are not licensed for reuse in other products.`,
        ],
      },
      {
        heading: 'MP3 encoder',
        blocks: [
          `Souvenir audio is encoded with lamejs, licensed under the GNU Lesser General Public License, version 3. It is loaded as its own separate file only when a souvenir's audio is made, and it is not merged into the rest of the app, so you can replace it with a modified version of the library.`,
        ],
      },
      {
        heading: 'Place data',
        blocks: [
          `The list of places you choose your birth place from is derived from GeoNames (https://www.geonames.org), licensed under the Creative Commons Attribution 4.0 International licence. It was reduced to place name, position, time zone and population, and we thank the GeoNames contributors.`,
        ],
      },
      {
        heading: 'Swiss Ephemeris and the voice model',
        blocks: [`Their licences have their own pages on the About screen.`],
      },
    ],
  };
}
