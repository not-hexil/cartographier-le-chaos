import { getDpr } from "../canvas";

const GLITCH_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·:/-_+";
const GLITCH_FPS = 12;
const MAX_DT = 0.1;
const REF_WIDTH = 720; // below this stage width, rings scale down

interface Glyph {
  ch: string;
  angle: number; // radians from the ring's start, measured to the glyph center
  width: number;
  rnd: number; // re-rolled at GLITCH_FPS
  alt: string; // re-rolled at GLITCH_FPS
}

interface Ring {
  radius: number;
  fontSize: number;
  speed: number; // rad/s, signed
  offset: number;
  glyphs: Glyph[];
}

export interface RingSpec {
  words: readonly string[];
  /** rad/s; positive = clockwise, negative = counter-clockwise */
  speed: number;
}

export interface WordRingsOptions {
  rings: readonly RingSpec[];
  innerRadius?: number; // px at REF_WIDTH
  ringStep?: number; // px at REF_WIDTH
  centerYRatio?: number; // ring center, fraction of stage height
  glitchBand?: number; // fraction of the ring diameter, measured from the top
  ink?: string;
  block?: string; // glitch block fill
  paper?: string; // glyph color on a glitch block (match the stage bg)
}

const DEFAULTS = {
  ringCount: 5,
  innerRadius: 180,
  ringStep: 46,
  centerYRatio: 0.64,
  glitchBand: 0.3,
  ink: "rgba(30, 28, 25, 0.5)",
  block: "rgba(30, 28, 25, 0.78)",
  paper: "#d9d7d1",
} as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export class WordRingsEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly options: Required<WordRingsOptions>;
  private readonly motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  private rings: Ring[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private scale = 1;
  private cx = 0;
  private cy = 0;
  private ringTop = 0;
  private bandH = 1;
  private family = "monospace";

  private visible = true;
  private reduced = this.motionQuery.matches;
  private destroyed = false;
  private rafId = 0;
  private last = 0;
  private glitchClock = 0;
  private resizeTimer: number | undefined;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: WordRingsOptions
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.options = { ...DEFAULTS, ...options };
  }

  start(): void {
    this.rebuild();

    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this.canvas);

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry?.isIntersecting ?? true;
      this.sync();
    });
    this.intersectionObserver.observe(this.canvas);

    this.motionQuery.addEventListener("change", this.onMotionChange);

    // glyph metrics depend on the resolved font
    void document.fonts?.ready.then(() => {
      if (!this.destroyed) this.rebuild();
    });

    this.sync();
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    window.clearTimeout(this.resizeTimer);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.motionQuery.removeEventListener("change", this.onMotionChange);
    this.rings = [];
  }

  // ---- events ------------------------------------------------------------

  private onResize = (): void => {
    const { clientWidth, clientHeight } = this.canvas;
    const unchanged =
      clientWidth === this.width &&
      clientHeight === this.height &&
      getDpr() === this.dpr;
    if (unchanged) return;

    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (!this.destroyed) this.rebuild();
    }, 150);
  };

  private onMotionChange = (e: MediaQueryListEvent): void => {
    this.reduced = e.matches;
    this.sync();
  };

  // ---- layout ------------------------------------------------------------

  private rebuild(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;

    const { innerRadius, ringStep, centerYRatio, glitchBand } = this.options;
    const ringCount = this.options.rings.length;

    this.dpr = getDpr();
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.family = getComputedStyle(this.canvas).fontFamily || "monospace";
    this.scale = Math.min(1, width / REF_WIDTH);
    this.cx = width / 2;
    this.cy = height * centerYRatio;

    const outer = (innerRadius + (ringCount - 1) * ringStep) * this.scale;
    this.ringTop = Math.max(0, this.cy - outer);
    this.bandH = Math.max(1, glitchBand * outer * 2);

    this.rings = this.options.rings.map((spec, i) => this.buildRing(spec, i));
    this.reroll();
    this.render();
  }

  private buildRing(spec: RingSpec, index: number): Ring {
    const { innerRadius, ringStep } = this.options;
    const { words } = spec;
    const { ctx, scale } = this;

    const radius = (innerRadius + index * ringStep) * scale;
    const fontSize = Math.max(7, (10 + index * 1.2) * scale);
    const letterGap = fontSize * 0.18;
    const wordGap = fontSize * 0.9;
    const circumference = 2 * Math.PI * radius;

    ctx.font = `${fontSize}px ${this.family}`;

    const ring: Ring = {
      radius,
      fontSize,
      speed: spec.speed,
      offset: Math.random() * Math.PI * 2,
      glyphs: [],
    };
    if (!words.length) return ring;

    // pick as many whole words as fit, then spread the leftover into word gaps
    const picked: { word: string; glyphWidths: number[] }[] = [];
    let used = 0;
    for (let i = 0; picked.length < 200; i++) {
      const word = (words[i % words.length] ?? "").toUpperCase();
      if (!word) break;
      const glyphWidths = [...word].map((ch) => ctx.measureText(ch).width);
      const wordWidth = glyphWidths.reduce((sum, w) => sum + w + letterGap, 0);
      if (picked.length && used + wordWidth + wordGap > circumference) break;
      picked.push({ word, glyphWidths });
      used += wordWidth + wordGap;
    }

    const extra = Math.max(0, (circumference - used) / picked.length);
    let pos = 0;
    for (const { word, glyphWidths } of picked) {
      [...word].forEach((ch, i) => {
        const width = glyphWidths[i] ?? 0;
        ring.glyphs.push({
          ch,
          angle: (pos + width / 2) / radius,
          width,
          rnd: 1,
          alt: ch,
        });
        pos += width + letterGap;
      });
      pos += wordGap + extra;
    }
    return ring;
  }

  private reroll(): void {
    for (const ring of this.rings) {
      for (const g of ring.glyphs) {
        g.rnd = Math.random();
        g.alt = GLITCH_POOL[(Math.random() * GLITCH_POOL.length) | 0] ?? g.ch;
      }
    }
  }

  // ---- loop --------------------------------------------------------------

  private sync(): void {
    if (this.visible && !this.reduced) {
      if (this.rafId) return;
      this.last = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      this.render(); // static frame
    }
  }

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const dt = Math.min((now - this.last) / 1000, MAX_DT);
    this.last = now;

    try {
      for (const ring of this.rings) ring.offset += ring.speed * dt;

      this.glitchClock += dt;
      if (this.glitchClock >= 1 / GLITCH_FPS) {
        this.glitchClock = 0;
        this.reroll();
      }

      this.render();
    } catch {
      // retry next frame
    }
  };

  private render(): void {
    const { ctx, canvas, dpr, cx, cy, width, height } = this;
    const { ink, block, paper } = this.options;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = "alphabetic";

    for (const ring of this.rings) {
      const { radius, fontSize, offset } = ring;
      ctx.font = `${fontSize}px ${this.family}`;
      ctx.fillStyle = ink;

      for (const g of ring.glyphs) {
        const a = g.angle + offset;
        const sin = Math.sin(a);
        const cos = Math.cos(a);
        const x = cx + radius * sin;
        const y = cy - radius * cos;

        if (x < -fontSize || x > width + fontSize) continue;
        if (y < -fontSize || y > height + fontSize) continue;

        // 1 at the top of the rings, 0 below the glitch band
        const heat = clamp01(1 - (y - this.ringTop) / this.bandH);
        const glitched = g.rnd < heat * 0.85;
        const blocked = g.rnd < heat * 0.28;

        ctx.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * y);

        if (blocked) {
          ctx.fillStyle = block;
          ctx.fillRect(-g.width / 2 - 1, -fontSize * 0.85, g.width + 2, fontSize * 1.1);
          ctx.fillStyle = paper;
          ctx.fillText(g.alt, -g.width / 2, 0);
          ctx.fillStyle = ink;
        } else {
          ctx.fillText(glitched ? g.alt : g.ch, -g.width / 2, 0);
        }
      }
    }
  }
}
