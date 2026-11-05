// The flat wheel: vector shapes for canvas and PDF, the PNG for Save image, and the 2D fallback when WebGL is unavailable.
import { GLYPHS, HOUSE_KEYS, SIGN_KEYS, type Chart, type ChartElementKey, type PlanetKey } from '../types';
import { RADIUS, anchorLongitude, houseArc, labelFor, labelSpot, litIds, parseKey, pickAt, planetPlots, polar, signArc, wheelAngle, type ParsedKey, type Plot } from './geometry';
import { GLYPH_FONT, ensureWheelFonts, readPalette, type WheelPalette } from './tokens';

/** Coordinates run 0 to size with y down; a glyph's x and y are its centre. */
export interface FlatWheelShapes {
  circles: { cx: number; cy: number; r: number; stroke: string; width: number }[];
  lines: { x1: number; y1: number; x2: number; y2: number; stroke: string; width: number }[];
  glyphs: { x: number; y: number; text: string; size: number; fill: string }[];
}

/** Ascendant at nine o'clock; used by canvas and PDF. */
export function flatWheelShapes(chart: Chart, size: number, withHouseNumbers: boolean): FlatWheelShapes {
  return buildShapes(chart, size, withHouseNumbers, null, readPalette(), true);
}

function buildShapes(chart: Chart, size: number, withHouseNumbers: boolean, highlight: ChartElementKey | null, palette: WheelPalette, withGlyphs: boolean): FlatWheelShapes {
  const shapes: FlatWheelShapes = { circles: [], lines: [], glyphs: [] };
  const centre = size / 2;
  const R = size * 0.48;
  const unit = size / 500;
  const X = (p: { x: number }) => centre + p.x * R;
  const Y = (p: { y: number }) => centre - p.y * R;
  const parsed = parseKey(chart, highlight);
  const lit = litIds(parsed);
  const tint = (id: string, base: string) => (!lit || lit.has(id) ? base : palette.dim);
  const anchor = anchorLongitude(chart);
  const plots = planetPlots(chart);
  const line = (a: Plot, b: Plot, stroke: string, width: number) =>
    shapes.lines.push({ x1: X(a), y1: Y(a), x2: X(b), y2: Y(b), stroke, width: width * unit });
  const glyph = (p: Plot, text: string, glyphSize: number, fill: string) =>
    shapes.glyphs.push({ x: X(p), y: Y(p), text, size: glyphSize * unit, fill });

  shapes.circles.push({ cx: centre, cy: centre, r: R, stroke: palette.ring, width: 1.5 * unit });
  for (const r of [RADIUS.signInner, RADIUS.houseInner, RADIUS.hub]) {
    shapes.circles.push({ cx: centre, cy: centre, r: r * R, stroke: lit ? palette.dim : palette.ring, width: unit * 0.8 });
  }

  SIGN_KEYS.forEach((sign, index) => {
    const arc = signArc(index, anchor);
    line(polar(RADIUS.signInner, arc.start), polar(RADIUS.outer, arc.start), lit ? palette.dim : palette.ring, 0.7);
    glyph(polar(RADIUS.signGlyph, arc.start + arc.sweep / 2), GLYPHS[sign], 15, tint(sign, palette.ring));
  });

  HOUSE_KEYS.forEach((house, index) => {
    const arc = houseArc(chart, index + 1, anchor);
    line(polar(RADIUS.hub, arc.start), polar(RADIUS.signInner, arc.start), tint(house, palette.ring), 0.8);
    if (withHouseNumbers) glyph(polar(RADIUS.houseMid, arc.start + arc.sweep / 2), String(index + 1), 11, tint(house, palette.mutedGlyph));
  });

  for (const angle of chart.angles) {
    const theta = wheelAngle(angle.longitude, anchor);
    line(polar(RADIUS.hub, theta), polar(RADIUS.signInner, theta), tint(angle.key, palette.ring), 1.6);
    glyph(polar(RADIUS.houseMid, theta - 0.09), GLYPHS[angle.key], 10, tint(angle.key, palette.moonlight));
  }

  for (const aspect of chart.aspects) {
    const a = plots.get(aspect.a);
    const b = plots.get(aspect.b);
    if (a && b) line(a, b, tint(aspect.key, palette.aspects[aspect.type]), lit?.has(aspect.key) ? 2 : 1);
  }

  for (const [key, plot] of plots) {
    const fill = tint(key, palette.planets[key]);
    shapes.circles.push({ cx: X(plot), cy: Y(plot), r: 2 * unit, stroke: fill, width: 4 * unit });
    glyph(polar(plot.r + 0.07, plot.theta), GLYPHS[key], 14, tint(key, palette.moonlight));
  }

  if (parsed) addHalo(shapes, chart, parsed, plots, palette, { R, X, Y, unit, line });
  if (!withGlyphs) shapes.glyphs.length = 0;   // the inset carries no glyphs, as frozen
  return shapes;
}

interface Draw {
  R: number; unit: number;
  X(p: { x: number }): number; Y(p: { y: number }): number;
  line(a: Plot, b: Plot, stroke: string, width: number): void;
}

function addHalo(shapes: FlatWheelShapes, chart: Chart, parsed: ParsedKey, plots: Map<PlanetKey, Plot>, palette: WheelPalette, draw: Draw): void {
  const anchor = anchorLongitude(chart);
  const ringAt = (p: Plot) => {
    shapes.circles.push({ cx: draw.X(p), cy: draw.Y(p), r: 16 * draw.unit, stroke: palette.halo, width: 1.5 * draw.unit });
    shapes.circles.push({ cx: draw.X(p), cy: draw.Y(p), r: 11 * draw.unit, stroke: palette.halo, width: 0.8 * draw.unit });
  };
  const sector = (inner: number, outer: number, arc: { start: number; sweep: number }) => {
    const steps = Math.max(4, Math.ceil(arc.sweep / 0.05));
    for (let i = 0; i < steps; i++) {
      const from = arc.start + (arc.sweep * i) / steps;
      const to = arc.start + (arc.sweep * (i + 1)) / steps;
      draw.line(polar(inner, from), polar(inner, to), palette.halo, 2);
      draw.line(polar(outer, from), polar(outer, to), palette.halo, 2);
    }
    draw.line(polar(inner, arc.start), polar(outer, arc.start), palette.halo, 2);
    draw.line(polar(inner, arc.start + arc.sweep), polar(outer, arc.start + arc.sweep), palette.halo, 2);
  };
  if (parsed.kind === 'planet') ringAt(plots.get(parsed.key)!);
  if (parsed.kind === 'aspect') { ringAt(plots.get(parsed.aspect.a)!); ringAt(plots.get(parsed.aspect.b)!); }
  if (parsed.kind === 'angle') ringAt(polar(RADIUS.houseMid, wheelAngle(chart.angles.find((a) => a.key === parsed.key)!.longitude, anchor)));
  if (parsed.kind === 'sign') sector(RADIUS.signInner, RADIUS.outer, signArc(parsed.index, anchor));
  if (parsed.kind === 'house') sector(RADIUS.houseInner, RADIUS.signInner, houseArc(chart, parsed.house, anchor));

  const spot = labelSpot(chart, plots, parsed);
  const text = labelFor(parsed);
  const width = text.length * 7.2 * draw.unit;
  shapes.glyphs.push({ x: draw.X(spot) + (spot.offset ? spot.offset * draw.R + width / 2 : 0), y: draw.Y(spot), text, size: 13 * draw.unit, fill: palette.ring });
}

export function drawShapes(ctx: CanvasRenderingContext2D, shapes: FlatWheelShapes): void {
  ctx.lineCap = 'round';
  for (const c of shapes.circles) {
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = c.width;
    ctx.stroke();
  }
  for (const l of shapes.lines) {
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.strokeStyle = l.stroke;
    ctx.lineWidth = l.width;
    ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const g of shapes.glyphs) {
    ctx.font = `${g.size}px ${GLYPH_FONT}`;
    ctx.fillStyle = g.fill;
    ctx.fillText(g.text, g.x, g.y);
  }
}

/** Draws the wheel with its highlight into a square of side `size` in canvas units. Used when WebGL is unavailable. */
export function drawFlatWheel(ctx: CanvasRenderingContext2D, chart: Chart, size: number, highlight: ChartElementKey | null, withGlyphs: boolean): void {
  drawShapes(ctx, buildShapes(chart, size, false, highlight, readPalette(), withGlyphs));
}

/** What a tap at (px, py) in a square of side `size` lands on. */
export function flatPick(chart: Chart, size: number, px: number, py: number): ChartElementKey | null {
  const R = size * 0.48;
  return pickAt(chart, planetPlots(chart), (px - size / 2) / R, (size / 2 - py) / R);
}

/** The flat wheel on chart ground, for Save image. */
export async function renderWheelPng(chart: Chart, sizePx: number): Promise<Uint8Array> {
  await ensureWheelFonts();
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  const palette = readPalette();
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, 0, sizePx, sizePx);
  drawShapes(ctx, buildShapes(chart, sizePx, false, null, palette, true));
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG encoding failed');
  return new Uint8Array(await blob.arrayBuffer());
}
