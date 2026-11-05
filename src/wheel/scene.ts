// Builds the wheel's meshes: base disc, gold ring, sign band, house cusps, planet spheres, aspect bars, glyph sprites and the halo.
import { BoxGeometry, Color, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, RingGeometry, Shape, SphereGeometry, Sprite, SpriteMaterial, TorusGeometry, type BufferGeometry, type Material, type Object3D } from 'three';
import { HOUSE_KEYS, SIGN_KEYS, type Chart, type PlanetKey } from '../types';
import type { GlyphAtlas } from './atlas';
import { RADIUS, anchorLongitude, houseArc, planetPlots, polar, signArc, wheelAngle, type ParsedKey, type Plot } from './geometry';
import type { WheelPalette } from './tokens';

export type WheelMode = 'main' | 'inset';
type Tinted = MeshStandardMaterial | MeshBasicMaterial | SpriteMaterial;

/** One thing that fades to chart-dim when another placement is lit. */
export interface Part {
  id: string;
  material: Tinted;
  base: Color;
  baseOpacity: number;
  litOpacity: number;
  from: Color;
  to: Color;
  fromOpacity: number;
  toOpacity: number;
  yieldsToLabel?: boolean;
  /** Runs at once when the part becomes lit or unlit. */
  onLit?: (lit: boolean) => void;
}

export interface WheelScene {
  root: Group;
  parts: Part[];
  plots: Map<PlanetKey, Plot>;
}

/** Heights above the wheel plane; `planet` is also the plane a tap is ray-cast onto. */
export const Z = { base: -0.03, band: 0, line: 0.024, halo: 0.05, planet: 0.055, sprite: 0.085 };

export function tintPart(part: Part, t: number): void {
  part.material.color.lerpColors(part.from, part.to, t);
  part.material.opacity = part.fromOpacity + (part.toOpacity - part.fromOpacity) * t;
  if (part.material instanceof MeshStandardMaterial) part.material.emissive.copy(part.material.color).multiplyScalar(0.4);
}

const unitBox = () => new BoxGeometry(1, 1, 1);

export function buildScene(chart: Chart, mode: WheelMode, palette: WheelPalette, atlas: GlyphAtlas): WheelScene {
  const root = new Group();
  const parts: Part[] = [];
  const inset = mode === 'inset';
  const lineWidth = inset ? 0.012 : 0.0055;
  const box = unitBox();
  const anchor = anchorLongitude(chart);
  const plots = planetPlots(chart);

  const addPart = (id: string, material: Tinted, base: string, opacity: number, litOpacity = opacity, onLit?: (lit: boolean) => void) => {
    const colour = new Color(base);
    material.color.copy(colour);
    material.opacity = opacity;
    material.transparent = true;
    const part: Part = { id, material, base: colour, baseOpacity: opacity, litOpacity, from: colour.clone(), to: colour.clone(), fromOpacity: opacity, toOpacity: opacity, onLit };
    tintPart(part, 1);
    parts.push(part);
    return part;
  };

  const bar = (a: Plot, b: Plot, z: number, width: number, material: Material): Mesh => {
    const mesh = new Mesh(box, material);
    mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, z);
    mesh.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    mesh.scale.set(Math.hypot(b.x - a.x, b.y - a.y), width, width);
    root.add(mesh);
    return mesh;
  };

  const sprite = (key: Parameters<GlyphAtlas['texture']>[0], at: Plot, size: number, id: string, colour: string, opacity = 1) => {
    const material = new SpriteMaterial({ map: atlas.texture(key), depthWrite: false });
    const part = addPart(id, material, colour, opacity);
    const glyph = new Sprite(material);
    glyph.position.set(at.x, at.y, Z.sprite);
    glyph.scale.set(size, size, 1);
    root.add(glyph);
    return part;
  };

  // Base disc: the wheel has a body, seen as its rim when it tilts.
  const disc = new CylinderGeometry(RADIUS.outer, RADIUS.outer, 0.05, 128);
  disc.rotateX(Math.PI / 2);
  const discMesh = new Mesh(disc, new MeshBasicMaterial({ color: palette.ground }));
  discMesh.position.z = Z.base;
  root.add(discMesh);
  const underRing = new Mesh(new TorusGeometry(RADIUS.outer, inset ? 0.005 : 0.003, 8, 180), new MeshBasicMaterial({ color: palette.dim }));
  underRing.position.z = Z.base - 0.025;
  root.add(underRing);

  // Outer gold ring: the frame stays gold while a placement is lit, as frozen.
  const ring = new Mesh(new TorusGeometry(RADIUS.outer, inset ? 0.009 : 0.005, 12, 180), new MeshStandardMaterial({ color: palette.ring, emissive: new Color(palette.ring).multiplyScalar(0.4), roughness: 0.35, metalness: 0.7 }));
  ring.position.z = Z.line;
  root.add(ring);

  for (const r of [RADIUS.signInner, RADIUS.houseInner, RADIUS.hub]) {
    const material = new MeshBasicMaterial({ depthWrite: false });
    addPart('ring', material, palette.ring, 0.5);
    const mesh = new Mesh(new TorusGeometry(r, inset ? 0.005 : 0.0028, 8, 160), material);
    mesh.position.z = Z.line;
    root.add(mesh);
  }

  SIGN_KEYS.forEach((sign, index) => {
    const arc = signArc(index, anchor);
    const material = new MeshStandardMaterial({ roughness: 0.6, metalness: 0.3, depthWrite: false });
    addPart(sign, material, palette.dim, 0.42);
    const shape = new Shape();
    shape.absarc(0, 0, RADIUS.outer, arc.start, arc.start + arc.sweep, false);
    shape.absarc(0, 0, RADIUS.signInner, arc.start + arc.sweep, arc.start, true);
    root.add(new Mesh(new ExtrudeGeometry(shape, { depth: Z.line, bevelEnabled: false, curveSegments: 16 }), material));
    const divider = new MeshBasicMaterial({ depthWrite: false });
    addPart('ring', divider, palette.ring, 0.5);
    bar(polar(RADIUS.signInner, arc.start), polar(RADIUS.outer, arc.start), Z.line, lineWidth * 0.7, divider);
    if (!inset) sprite(sign, polar(RADIUS.signGlyph, arc.start + arc.sweep / 2), 0.105, sign, palette.mutedGlyph).yieldsToLabel = true;
  });

  HOUSE_KEYS.forEach((house, index) => {
    const arc = houseArc(chart, index + 1, anchor);
    const material = new MeshBasicMaterial({ depthWrite: false });
    addPart(house, material, palette.ring, 0.55);
    bar(polar(RADIUS.hub, arc.start), polar(RADIUS.signInner, arc.start), Z.line, lineWidth, material);
  });

  for (const angle of chart.angles) {
    const theta = wheelAngle(angle.longitude, anchor);
    const axis = new MeshBasicMaterial({ depthWrite: false });
    addPart(angle.key, axis, palette.ring, 0.9);
    bar(polar(RADIUS.hub, theta), polar(RADIUS.signInner, theta), Z.line, lineWidth * 1.7, axis);
    const mark = polar(RADIUS.houseMid, theta);
    const diamondMaterial = new MeshStandardMaterial({ roughness: 0.4, metalness: 0.5 });
    addPart(angle.key, diamondMaterial, palette.ring, 1);
    const diamond = new Mesh(new OctahedronGeometry(inset ? 0.034 : 0.021), diamondMaterial);
    diamond.position.set(mark.x, mark.y, Z.planet);
    root.add(diamond);
    if (!inset) sprite(angle.key, polar(RADIUS.houseMid, theta - 0.11), 0.1, angle.key, palette.moonlight);
  }

  for (const aspect of chart.aspects) {
    const a = plots.get(aspect.a);
    const b = plots.get(aspect.b);
    if (!a || !b) continue;
    const material = new MeshBasicMaterial({ depthWrite: false });
    const width = lineWidth * 1.15;
    let mesh: Mesh | null = null;
    addPart(aspect.key, material, palette.aspects[aspect.type], Math.max(0.35, 0.85 - aspect.orb * 0.07), 1, (lit) => {
      if (!mesh) return;
      mesh.scale.y = mesh.scale.z = lit ? width * 1.9 : width;
    });
    mesh = bar(a, b, Z.line + 0.006, width, material);
  }

  const sphere = new SphereGeometry(inset ? 0.045 : 0.03, 24, 16);
  for (const [key, plot] of plots) {
    const material = new MeshStandardMaterial({ roughness: 0.32, metalness: 0.25 });
    const mesh = new Mesh(sphere, material);
    addPart(key, material, palette.planets[key], 1, 1, (lit) => mesh.scale.setScalar(lit ? 1.25 : 1));
    mesh.position.set(plot.x, plot.y, Z.planet);
    root.add(mesh);
    if (!inset) sprite(key, polar(plot.r + 0.078, plot.theta), 0.098, key, palette.moonlight).yieldsToLabel = true;
  }

  return { root, parts, plots };
}

/** The halo of a lit placement. Each mesh carries its full opacity in userData so the engine can pulse it. */
export function buildHalo(chart: Chart, parsed: ParsedKey, plots: Map<PlanetKey, Plot>, mode: WheelMode, palette: WheelPalette): Group {
  const group = new Group();
  const anchor = anchorLongitude(chart);
  const scale = mode === 'inset' ? 1.6 : 1;
  const add = (geometry: BufferGeometry, opacity: number, x = 0, y = 0, z = Z.halo) => {
    const material = new MeshBasicMaterial({ color: palette.halo, transparent: true, opacity, depthWrite: false, side: 2 });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData.fullOpacity = opacity;
    group.add(mesh);
  };
  const ringsAt = (p: Plot, z = Z.planet) => {
    add(new RingGeometry(0.066 * scale, 0.074 * scale, 64), 0.95, p.x, p.y, z);
    add(new RingGeometry(0.045 * scale, 0.05 * scale, 48), 0.6, p.x, p.y, z);
  };
  const sector = (inner: number, outer: number, arc: { start: number; sweep: number }, z: number) => {
    add(new RingGeometry(inner, outer, 48, 1, arc.start, arc.sweep), 0.3, 0, 0, z);
    add(new RingGeometry(outer - 0.008, outer, 48, 1, arc.start, arc.sweep), 0.95, 0, 0, z + 0.002);
    add(new RingGeometry(inner, inner + 0.008, 48, 1, arc.start, arc.sweep), 0.95, 0, 0, z + 0.002);
  };
  switch (parsed.kind) {
    case 'planet': ringsAt(plots.get(parsed.key)!); break;
    case 'aspect': ringsAt(plots.get(parsed.aspect.a)!); ringsAt(plots.get(parsed.aspect.b)!); break;
    case 'angle': ringsAt(polar(RADIUS.houseMid, wheelAngle(chart.angles.find((a) => a.key === parsed.key)!.longitude, anchor))); break;
    case 'sign': sector(RADIUS.signInner, RADIUS.outer, signArc(parsed.index, anchor), Z.line + 0.012); break;
    case 'house': sector(RADIUS.houseInner, RADIUS.signInner, houseArc(chart, parsed.house, anchor), Z.line + 0.012); break;
  }
  return group;
}

export function disposeTree(root: Object3D): void {
  root.traverse((node) => {
    const mesh = node as Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as Material | Material[] | undefined;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose();
  });
}
