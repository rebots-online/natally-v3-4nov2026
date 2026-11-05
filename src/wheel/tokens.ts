// Colours and timings of the wheel, read from the design tokens at run time so no value is typed here (§9.3).
import { PLANET_KEYS, type AspectType, type PlanetKey } from '../types';

export interface WheelPalette {
  ground: string; ring: string; dim: string; halo: string; moonlight: string; sunlight: string; mutedGlyph: string;
  planets: Record<PlanetKey, string>;
  aspects: Record<AspectType, string>;
}

const PLANET_TOKEN: Record<PlanetKey, string> = {
  sun: 'chart-sun', moon: 'chart-moon', mercury: 'chart-mercury', venus: 'chart-venus', mars: 'chart-mars', jupiter: 'chart-jupiter',
  saturn: 'chart-saturn', uranus: 'chart-uranus', neptune: 'chart-neptune', pluto: 'chart-pluto', north_node: 'chart-node',
};

function colour(style: CSSStyleDeclaration, name: string): string {
  const value = style.getPropertyValue(`--color-${name}`).trim();
  if (!value) throw new Error(`Design token --color-${name} is not loaded`);
  return value;
}

export function readPalette(): WheelPalette {
  const style = getComputedStyle(document.documentElement);
  const planets = {} as Record<PlanetKey, string>;
  for (const key of PLANET_KEYS) planets[key] = colour(style, PLANET_TOKEN[key]);
  const tension = colour(style, 'aspect-tension');
  const harmony = colour(style, 'aspect-harmony');
  return {
    ground: colour(style, 'ground-deep'),
    ring: colour(style, 'chart-ring'),
    dim: colour(style, 'chart-dim'),
    halo: colour(style, 'chart-halo'),
    moonlight: colour(style, 'chart-moon'),
    sunlight: colour(style, 'chart-sun'),
    mutedGlyph: colour(style, 'chart-node'),
    planets,
    aspects: { conjunction: colour(style, 'aspect-conjunction'), sextile: harmony, trine: harmony, square: tension, opposition: tension },
  };
}

/** A duration token in milliseconds; the tokens themselves drop to 0 under reduced motion. */
export function readDurationMs(name: 'highlight-pulse' | 'duration-swap'): number {
  const parsed = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--${name}`));
  return Number.isFinite(parsed) ? parsed : 0;
}

export const GLYPH_FONT = '"Natally Symbols", "Cinzel", serif';
export const LABEL_FONT = '"Cinzel", "Natally Symbols", serif';

/** Resolves once the fonts that draw the glyphs and labels have loaded, or failed to; a canvas must be redrawn afterwards. */
export async function ensureWheelFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.allSettled([
    document.fonts.load(`48px ${GLYPH_FONT}`, '☉☿♈'),
    document.fonts.load(`48px ${GLYPH_FONT}`, '☽♀♉'),
    document.fonts.load(`700 48px ${LABEL_FONT}`, 'ASC'),
  ]);
}
