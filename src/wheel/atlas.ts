// One canvas atlas of the wheel's glyphs, drawn in Natally Symbols; each sprite shows one cell and tints it through its material.
import { CanvasTexture, SRGBColorSpace, type Texture } from 'three';
import { ANGLE_KEYS, GLYPHS, PLANET_KEYS, SIGN_KEYS, type AngleKey, type PlanetKey, type SignKey } from '../types';
import { GLYPH_FONT, ensureWheelFonts } from './tokens';

type GlyphKey = PlanetKey | AngleKey | SignKey;

const CELL = 128;
const COLUMNS = 7;
const KEYS: GlyphKey[] = [...PLANET_KEYS, ...SIGN_KEYS, ...ANGLE_KEYS];
const ROWS = Math.ceil(KEYS.length / COLUMNS);

export class GlyphAtlas {
  private readonly canvas = document.createElement('canvas');
  private readonly base: CanvasTexture;
  private readonly cells = new Map<GlyphKey, Texture>();
  private disposed = false;

  constructor(onRedrawn: () => void) {
    this.canvas.width = CELL * COLUMNS;
    this.canvas.height = CELL * ROWS;
    this.base = new CanvasTexture(this.canvas);
    this.base.colorSpace = SRGBColorSpace;
    this.base.anisotropy = 4;
    this.draw();
    void ensureWheelFonts().then(() => {
      if (this.disposed) return;
      this.draw();
      this.base.needsUpdate = true;
      for (const texture of this.cells.values()) texture.needsUpdate = true;
      onRedrawn();
    });
  }

  texture(key: GlyphKey): Texture {
    const cached = this.cells.get(key);
    if (cached) return cached;
    const index = KEYS.indexOf(key);
    const texture = this.base.clone();
    texture.repeat.set(1 / COLUMNS, 1 / ROWS);
    texture.offset.set((index % COLUMNS) / COLUMNS, 1 - (Math.floor(index / COLUMNS) + 1) / ROWS);
    texture.needsUpdate = true;
    this.cells.set(key, texture);
    return texture;
  }

  dispose(): void {
    this.disposed = true;
    for (const texture of this.cells.values()) texture.dispose();
    this.base.dispose();
  }

  private draw(): void {
    const ctx = this.canvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    KEYS.forEach((key, index) => {
      const angle = (ANGLE_KEYS as readonly string[]).includes(key);
      ctx.font = `${angle ? '700 44' : '88'}px ${GLYPH_FONT}`;
      ctx.fillText(GLYPHS[key], (index % COLUMNS + 0.5) * CELL, (Math.floor(index / COLUMNS) + 0.5) * CELL);
    });
  }
}
