// §14.3: the prompt for one souvenir element. System persona as §13.1 (from the bundled brand file), then the chart facts, then the element.
import brand from '../../public/brand/brand.json' with { type: 'json' };
import type { AnglePosition, ChartAspect, PlanetPosition, SouvenirElementId, SouvenirSnapshot } from '../../src/types/index.ts';

type Message = { role: 'system' | 'user'; content: string };
const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const word = (key: string): string => key.split('_').map(cap).join(' ');
const ordinal = (n: number): string => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4]}`;
const pad = (n: number): string => String(n).padStart(2, '0');
const place = (p: { sign: string; degree: number; minute: number }): string => `${cap(p.sign)} ${p.degree}°${pad(p.minute)}'`;

function aspectName(a: Pick<ChartAspect, 'a' | 'b' | 'type'>): string {
  return `${word(a.a)} ${cap(a.type)} ${word(a.b)}`;
}

/** The English name of any element key: "Venus", "7th House", "Sun Trine Jupiter". */
export function elementName(key: SouvenirElementId): string {
  if (key.startsWith('aspect:')) {
    const [, a, type, b] = key.split(':');
    return `${word(a!)} ${cap(type!)} ${word(b!)}`;
  }
  if (key.startsWith('house_')) return `${ordinal(Number(key.slice(6)))} House`;
  if (key === 'ic') return 'Imum Coeli';
  if (key === 'midheaven') return 'Midheaven';
  return word(key);
}

function planetLine(p: PlanetPosition): string {
  return `${word(p.key)}: ${place(p)}, house ${p.house}, ${p.retrograde ? 'retrograde' : 'direct'}`;
}
function angleLine(a: AnglePosition): string {
  return `${elementName(a.key)}: ${place(a)}`;
}

function chartBlock(s: SouvenirSnapshot): string {
  const b = s.birth;
  const when = `${b.day} ${MONTHS[b.month - 1] ?? ''} ${b.year}`;
  const time = b.timeUnknown || b.hour === null || b.minute === null ? 'time unknown' : `${pad(b.hour)}:${pad(b.minute)}`;
  const c = s.chart;
  const lines = [
    `Name: ${b.name}`, `Born: ${when}, ${time}, ${b.place.label}`,
    `House system: ${c.houseSystem === 'placidus' ? 'Placidus' : 'Whole Sign'} (${c.houseSystemReason.replace('_', ' ')})`,
    ...c.planets.map(planetLine),
    ...(c.angles.length > 0 ? c.angles.map(angleLine) : ['Angles: not known without a birth time']),
    ...c.houses.map((h) => `${ordinal(h.house)} house cusp: ${cap(h.sign)}`),
    ...c.aspects.filter((a) => a.orb <= 3).slice(0, 20).map((a) => `${aspectName(a)}, orb ${a.orb.toFixed(1)}°`),
  ];
  return lines.join('\n');
}

/** What the chart says about this one element, so the model does not have to infer it. */
function elementFacts(s: SouvenirSnapshot, key: SouvenirElementId): string {
  const c = s.chart;
  const planet = c.planets.find((p) => p.key === key);
  if (planet) return planetLine(planet);
  const angle = c.angles.find((a) => a.key === key);
  if (angle) return angleLine(angle);
  if (key.startsWith('aspect:')) {
    const a = c.aspects.find((x) => x.key === key);
    return a ? `${aspectName(a)}, orb ${a.orb.toFixed(1)}°, ${a.applying ? 'applying' : 'separating'}` : elementName(key);
  }
  if (key.startsWith('house_')) {
    const n = Number(key.slice(6));
    const cusp = c.houses.find((h) => h.house === n);
    const inside = c.planets.filter((p) => p.house === n).map((p) => word(p.key));
    return `${elementName(key)}: cusp in ${cusp ? cap(cusp.sign) : 'an unknown sign'}; ${inside.length > 0 ? `contains ${inside.join(', ')}` : 'holds no planet'}`;
  }
  if (SIGNS.includes(key)) {
    const inside = c.planets.filter((p) => p.sign === key).map((p) => word(p.key));
    const cusps = c.houses.filter((h) => h.sign === key).map((h) => ordinal(h.house));
    return `${cap(key)}: ${inside.length > 0 ? `holds ${inside.join(', ')}` : 'holds no planet'}; ${cusps.length > 0 ? `on the cusp of the ${cusps.join(', ')} house` : 'on no house cusp'}`;
  }
  return elementName(key);
}

const FIELDS = 'subtitle, relation, aside, origins, traditional, lore, examples';

export function buildMessages(appName: string, s: SouvenirSnapshot, key: SouvenirElementId, shorter: boolean): Message[] {
  const c = brand.character;
  const opening = key === 'opening_reading';
  const persona = `${c.reading} ${c.aside} ${c.continuity} ${c.care}`;
  const rules = [
    `You are ${appName}.`, 'Use only the facts given; never invent a placement. Speak in full sentences of plain text with no markdown or lists.',
    'Say plainly when the birth time is unknown. Add no disclaimers.',
    `Answer with one JSON object and nothing else, with exactly these string fields: ${FIELDS}.`,
  ];
  let ask: string;
  if (opening) {
    rules.push('For this request, "relation" holds a full personal reading of the whole chart, about 300 words, spoken to the customer by name. Set every other field to an empty string.');
    ask = `Please give me my personal reading.${shorter ? ' Be shorter.' : ''}`;
  } else {
    rules.push(
      'Field lengths: "subtitle" is a short line. "relation" is how this element sits in this chart, about 60 words, speaking to the customer. "aside" is your dry aside, about 25 words.',
      '"origins", "traditional" and "lore" are 70 to 100 words each. "examples" is 70 to 100 words of concrete examples of how it shows in a life.',
    );
    ask = `Write the souvenir chapter for ${elementName(key)}.${shorter ? ' Be shorter.' : ''}`;
  }
  return [
    { role: 'system', content: persona },
    { role: 'system', content: rules.join(' ') },
    { role: 'system', content: `Chart facts:\n${chartBlock(s)}` },
    { role: 'system', content: opening ? 'Element: the whole chart.' : `Element: ${elementName(key)}.\n${elementFacts(s, key)}` },
    { role: 'user', content: ask },
  ];
}
