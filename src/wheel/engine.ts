// The imperative 3D wheel: one renderer, one camera, one loop. React never re-renders this; ChartWheel only calls its setters.
import { AmbientLight, CanvasTexture, Color, DirectionalLight, Group, Matrix4, type Mesh, type MeshBasicMaterial, PerspectiveCamera, Plane, Raycaster, Scene, SRGBColorSpace, Sprite, SpriteMaterial, Vector2, Vector3, WebGLRenderer } from 'three';
import { GLYPHS, type Chart, type ChartElementKey } from '../types';
import { GlyphAtlas } from './atlas';
import { labelFor, labelSpot, litIds, parseKey, pickAt, type LabelSpot, type ParsedKey } from './geometry';
import { Z, buildHalo, buildScene, disposeTree, tintPart, type WheelMode, type WheelScene } from './scene';
import { LABEL_FONT, ensureWheelFonts, readDurationMs, readPalette, type WheelPalette } from './tokens';

const REST_TILT = (18 * Math.PI) / 180;
const MAX_TILT = (62 * Math.PI) / 180;
const FOV = 20;
const FIT_RADIUS = 0.995;               // at rest tilt the wheel fills 96% of the short side, as frozen
const FIT_WIDTH = 1.04;                 // and the near edge of a tilted wheel still clears the sides of a square inset
const SPIN_PER_MS = (-2 * Math.PI) / 240000;
const SPIN_PAUSE_AFTER_DRAG_MS = 4000;
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2.5;
const TAP_SLOP_PX = 6;
const DRAG_RADIANS_PER_PX = 0.012;
const TILT_RADIANS_PER_PX = 0.006;
const LABEL_HEIGHT = 0.078;
const DEFAULT_LABEL_WIDTH = 512;

export interface WheelCallbacks { onSelect(key: ChartElementKey): void; canSelect(): boolean; onContextLost(): void; }

export class WheelEngine {
  private readonly canvas = document.createElement('canvas');
  private readonly renderer: WebGLRenderer;
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private readonly world = new Scene();
  private readonly spinGroup = new Group();
  private readonly palette: WheelPalette;
  private readonly atlas: GlyphAtlas;
  private readonly raycaster = new Raycaster();
  private readonly resize: ResizeObserver;
  private readonly visibility: IntersectionObserver;
  private wheel: WheelScene;
  private chart: Chart;
  private highlight: ChartElementKey | null = null;
  private halo: Group | null = null;
  private label: Sprite | null = null;
  private labelSpot: LabelSpot | null = null;
  private labelVersion = 0;

  private spin = 0;
  private tilt = REST_TILT;
  private zoom = 1;
  private distance = 10;
  private paused = false;
  private visible = true;
  private spinResumeAt = 0;
  private fadeStart = -1;
  private fadeMs = 0;
  private pulseMs = 0;
  private pulseStart = 0;
  private lastFrame = 0;
  private frame = 0;
  private disposed = false;

  private readonly pointers = new Map<number, { x: number; y: number }>();
  private dragged = false;
  private pressX = 0;
  private pressY = 0;
  private pinchDistance = 0;
  private pinchZoom = 1;
  private suppressClick = false;

  constructor(private readonly host: HTMLElement, chart: Chart, private readonly mode: WheelMode, paused: boolean, private readonly callbacks: WheelCallbacks) {
    this.chart = chart;
    this.paused = paused;
    this.palette = readPalette();
    this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setClearColor(0, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    host.appendChild(this.canvas);

    this.world.add(new AmbientLight(new Color(this.palette.moonlight), 1.1));
    const key = new DirectionalLight(new Color(this.palette.moonlight), 2.2);
    key.position.set(-2.2, 2.6, 3.6);
    this.world.add(key);
    this.world.add(this.spinGroup);

    this.atlas = new GlyphAtlas(() => this.invalidate());
    this.wheel = buildScene(chart, mode, this.palette, this.atlas);
    this.spinGroup.add(this.wheel.root);

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('webglcontextlost', this.onContextLost);

    this.resize = new ResizeObserver(() => this.fit());
    this.resize.observe(host);
    this.visibility = new IntersectionObserver((entries) => {
      this.visible = entries.at(-1)?.isIntersecting ?? true;
      this.invalidate();
    });
    this.visibility.observe(host);
    this.fit();
  }

  setChart(chart: Chart): void {
    if (chart === this.chart) return;
    this.chart = chart;
    this.spinGroup.remove(this.wheel.root);
    disposeTree(this.wheel.root);
    this.wheel = buildScene(chart, this.mode, this.palette, this.atlas);
    this.spinGroup.add(this.wheel.root);
    const highlight = this.highlight;
    this.highlight = null;
    this.setHighlight(highlight, true);
    this.invalidate();
  }

  setHighlight(key: ChartElementKey | null, instant = false): void {
    if (key === this.highlight) return;
    this.highlight = key;
    const parsed = parseKey(this.chart, key);
    const lit = litIds(parsed);
    for (const part of this.wheel.parts) {
      const on = !!lit && lit.has(part.id);
      part.from.copy(part.material.color);
      part.fromOpacity = part.material.opacity;
      part.to.copy(!lit || on ? part.base : new Color(this.palette.dim));
      // A selected planet's or sign's own glyph gives way to the label, which carries it.
      part.toOpacity = on && part.yieldsToLabel && this.mode === 'main' ? 0 : on ? part.litOpacity : part.baseOpacity;
      part.onLit?.(on);
    }
    this.fadeMs = this.paused || instant ? 0 : readDurationMs('duration-swap');
    this.fadeStart = performance.now();
    this.replaceHalo(parsed);
    this.pulseMs = readDurationMs('highlight-pulse');
    this.pulseStart = performance.now();
    this.invalidate();
  }

  setMotionPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;
    this.invalidate();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resize.disconnect();
    this.visibility.disconnect();
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.clearHalo();
    disposeTree(this.wheel.root);
    this.atlas.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }

  // ---- Highlight ----

  private clearHalo(): void {
    if (this.halo) { this.spinGroup.remove(this.halo); disposeTree(this.halo); this.halo = null; }
    if (this.label) {
      this.spinGroup.remove(this.label);
      (this.label.material as SpriteMaterial).map?.dispose();
      this.label.material.dispose();
      this.label = null;
    }
    this.labelSpot = null;
  }

  private replaceHalo(parsed: ParsedKey | null): void {
    this.clearHalo();
    if (!parsed) return;
    this.halo = buildHalo(this.chart, parsed, this.wheel.plots, this.mode, this.palette);
    this.spinGroup.add(this.halo);
    if (this.mode === 'main') this.addLabel(parsed);
  }

  private addLabel(parsed: ParsedKey): void {
    const version = ++this.labelVersion;
    const canvas = document.createElement('canvas');
    canvas.height = 64;
    canvas.width = DEFAULT_LABEL_WIDTH;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    const sprite = new Sprite(new SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }));
    sprite.renderOrder = 5;
    const spot = labelSpot(this.chart, this.wheel.plots, parsed);
    sprite.center.set(spot.offset ? 0 : 0.5, 0.5);
    const text = (parsed.kind === 'planet' || parsed.kind === 'sign' ? `${GLYPHS[parsed.key]} ` : '') + labelFor(parsed);
    const paint = () => {
      const ctx = canvas.getContext('2d')!;
      ctx.font = `700 42px ${LABEL_FONT}`;
      const width = Math.ceil(ctx.measureText(text).width) + 8;
      if (canvas.width !== width) { canvas.width = width; texture.dispose(); }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `700 42px ${LABEL_FONT}`;
      ctx.fillStyle = this.palette.ring;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 4, canvas.height / 2);
      sprite.scale.set((LABEL_HEIGHT * width) / canvas.height, LABEL_HEIGHT, 1);
      texture.needsUpdate = true;
      this.invalidate();
    };
    paint();
    void ensureWheelFonts().then(() => { if (!this.disposed && version === this.labelVersion) paint(); });
    this.label = sprite;
    this.labelSpot = spot;
    this.spinGroup.add(sprite);
  }

  // ---- Loop ----

  private invalidate(): void {
    if (this.frame || this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number): void => {
    this.frame = 0;
    if (this.disposed) return;
    const dt = Math.min(now - (this.lastFrame || now), 100);
    this.lastFrame = now;
    let again = false;

    if (!this.paused && this.pointers.size === 0 && this.visible) {
      if (now >= this.spinResumeAt) this.spin += SPIN_PER_MS * dt;
      again = true;     // the spin resumes by itself, so the loop stays alive through its pause
    }
    if (this.fadeStart >= 0) {
      const t = this.fadeMs > 0 ? Math.min(1, (now - this.fadeStart) / this.fadeMs) : 1;
      const eased = 1 - (1 - t) ** 3;
      for (const part of this.wheel.parts) tintPart(part, eased);
      if (t >= 1) this.fadeStart = -1; else again = true;
    }
    if (this.halo) {
      const motion = !this.paused && this.pulseMs > 0;
      const pulse = motion ? 0.72 + 0.28 * Math.cos(((now - this.pulseStart) / this.pulseMs) * 2 * Math.PI) : 1;
      for (const child of this.halo.children) {
        const mesh = child as Mesh<never, MeshBasicMaterial>;
        mesh.material.opacity = (mesh.userData.fullOpacity as number) * pulse;
      }
      if (motion && this.visible) again = true;
    }
    this.draw();
    if (again) this.invalidate();
  };

  private draw(): void {
    this.spinGroup.rotation.z = this.spin;
    if (this.label && this.labelSpot) {
      // The label stays upright to the right of its marker however the wheel has turned.
      const { x, y, offset } = this.labelSpot;
      this.label.position.set(x + offset * Math.cos(-this.spin), y + offset * Math.sin(-this.spin), Z.sprite + 0.01);
    }
    // Perspective makes the near edge bigger, so the view pans to keep the tilted wheel centred in its frame.
    const sin = Math.sin(this.tilt);
    const cos = Math.cos(this.tilt);
    const middle = (((cos / (this.distance + sin)) - (cos / (this.distance - sin))) / 2) * (this.distance / cos);
    this.camera.position.set(0, middle - sin * this.distance, cos * this.distance);
    this.camera.lookAt(0, middle, 0);
    this.renderer.render(this.world, this.camera);
  }

  private fit(): void {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.distance = Math.max(FIT_RADIUS, FIT_WIDTH / aspect) / Math.tan((FOV * Math.PI) / 360);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
    this.draw();
  }

  private setZoom(zoom: number): boolean {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
    if (next === this.zoom) return false;
    this.zoom = next;
    this.camera.zoom = next;
    this.camera.updateProjectionMatrix();
    this.invalidate();
    return true;
  }

  // ---- Pointer ----

  private pick(clientX: number, clientY: number): ChartElementKey | null {
    const rect = this.canvas.getBoundingClientRect();
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(new Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1), this.camera);
    this.spinGroup.updateWorldMatrix(true, false);
    const local = this.raycaster.ray.clone().applyMatrix4(new Matrix4().copy(this.spinGroup.matrixWorld).invert());
    const hit = local.intersectPlane(new Plane(new Vector3(0, 0, 1), -Z.planet), new Vector3());
    return hit ? pickAt(this.chart, this.wheel.plots, hit.x, hit.y) : null;
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.canvas.setPointerCapture(e.pointerId);
    if (this.pointers.size === 1) {
      this.dragged = false;
      this.suppressClick = false;
      this.pressX = e.clientX;
      this.pressY = e.clientY;
    } else if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchDistance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      this.pinchZoom = this.zoom;
      this.dragged = true;
    }
    this.invalidate();
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    const known = this.pointers.get(e.pointerId);
    if (!known) {
      if (e.pointerType === 'mouse' && this.mode === 'main' && this.callbacks.canSelect()) {
        this.canvas.style.cursor = this.pick(e.clientX, e.clientY) ? 'pointer' : 'grab';
      }
      return;
    }
    const dx = e.clientX - known.x;
    const dy = e.clientY - known.y;
    known.x = e.clientX;
    known.y = e.clientY;
    if (this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      if (this.pinchDistance > 0) this.setZoom(this.pinchZoom * (Math.hypot(a!.x - b!.x, a!.y - b!.y) / this.pinchDistance));
      return;
    }
    if (!this.dragged && Math.hypot(e.clientX - this.pressX, e.clientY - this.pressY) <= TAP_SLOP_PX) return;
    this.dragged = true;
    this.canvas.style.cursor = 'grabbing';
    const rect = this.canvas.getBoundingClientRect();
    // A wheel turns under the finger: moving right above its centre turns it clockwise, below its centre the other way.
    const side = e.clientY < rect.top + rect.height / 2 ? -1 : 1;
    this.spin += dx * DRAG_RADIANS_PER_PX * side;
    this.tilt = Math.min(MAX_TILT, Math.max(0, this.tilt + dy * TILT_RADIANS_PER_PX));
    this.spinResumeAt = performance.now() + SPIN_PAUSE_AFTER_DRAG_MS;
    this.invalidate();
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (!this.pointers.delete(e.pointerId)) return;
    this.lastFrame = 0;
    this.canvas.style.cursor = 'grab';
    if (this.dragged) {
      this.suppressClick = true;
      this.spinResumeAt = performance.now() + SPIN_PAUSE_AFTER_DRAG_MS;
    } else if (this.pointers.size === 0 && this.mode === 'main' && this.callbacks.canSelect()) {
      const key = this.pick(e.clientX, e.clientY);
      if (key) this.callbacks.onSelect(key);
    }
    this.invalidate();
  };

  private readonly onPointerCancel = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    this.invalidate();
  };

  // A drag must not reach a parent as a tap: in the inset a tap is the swap, and it bubbles only when nothing was dragged.
  private readonly onClick = (e: MouseEvent): void => {
    if (this.suppressClick) { e.stopPropagation(); this.suppressClick = false; }
  };

  private readonly onWheel = (e: WheelEvent): void => {
    if (this.setZoom(this.zoom * Math.exp(-e.deltaY * 0.0015))) e.preventDefault();
  };

  private readonly onContextLost = (e: Event): void => {
    e.preventDefault();
    if (!this.disposed) this.callbacks.onContextLost();
  };
}
