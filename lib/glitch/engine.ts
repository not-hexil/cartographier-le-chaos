import { getDpr } from "../canvas";

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·:/-_+.";
const MAX_SEGMENTS = 90;

const randomGlyph = () => POOL[(Math.random() * POOL.length) | 0] ?? "·";

interface Segment {
  row: number;
  col: number;
  chars: string[];
  filled: boolean; // light block + dark text, vs bare dim text
  dieAt: number;
  nextScramble: number;
  edge: number;
}

export interface GlitchStripOptions {
  words: readonly string[];
  fontSize?: number; // px
  paper?: string; // block fill
  ink?: string; // text on a block
  dim?: string; // bare text
  falloff?: number; // density exponent, higher = tighter to the top edge
  intensity?: number; // base spawn events per second
    centerClear?: number; // fraction of the width kept empty in the middle
}

const DEFAULTS = {
  fontSize: 11,
  paper: "#d9d7d1",
  ink: "#1e1c19",
  dim: "rgba(217, 215, 209, 0.35)",
  falloff: 1.8,
  intensity: 28,
  centerClear: 0.5,
} as const;

export class GlitchStripEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly options: Required<GlitchStripOptions>;
  private readonly motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  private segments: Segment[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private cellW = 7;
  private cellH = 18;
  private cols = 1;
  private rows = 1;
  private family = "monospace";

  private visible = true;
  private reduced = this.motionQuery.matches;
  private destroyed = false;
  private rafId = 0;
  private nextSpawnAt = 0;
  private resizeTimer: number | undefined;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: GlitchStripOptions
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
    this.segments = [];
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

    const { fontSize } = this.options;

    this.dpr = getDpr();
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * this.dpr); // resets ctx state
    this.canvas.height = Math.round(height * this.dpr);
    this.family = getComputedStyle(this.canvas).fontFamily || "monospace";

    this.ctx.font = `${fontSize}px ${this.family}`;
    this.cellW = this.ctx.measureText("M").width || fontSize * 0.6;
    this.cellH = Math.round(fontSize * 1.6);
    this.cols = Math.max(1, Math.ceil(width / this.cellW));
    this.rows = Math.max(1, Math.ceil(height / this.cellH));

    this.segments = [];
    const now = performance.now();
    for (let i = 0; i < 22; i++) this.spawn(now);
    this.render();
  }

  // ---- segments ----------------------------------------------------------

  /** 1 at the top row, falling toward 0 at the bottom. */
  private weight(row: number): number {
    return Math.pow(1 - row / this.rows, this.options.falloff);
  }

  private spawn(now: number): void {
    if (this.segments.length >= MAX_SEGMENTS) return;

    // density-weighted row via rejection sampling
    let row = 0;
    for (let tries = 0; tries < 6; tries++) {
      row = (Math.random() * this.rows) | 0;
      if (Math.random() < this.weight(row)) break;
    }

    // each side gets a band; the middle `centerClear` of the width stays empty
    const band = Math.max(
      3,
      Math.floor((this.cols * (1 - this.options.centerClear)) / 2)
    );

    const w = this.weight(row);
    const filled = Math.random() < 0.18 + 0.5 * w;
    const maxLen = filled ? 22 : 10;
    // heavy tail: many short runs, a few long ones; never wider than the band
    const len = Math.min(
      band,
      Math.max(filled ? 3 : 1, Math.round(1 + Math.random() ** 2 * maxLen))
    );

    // distance from the screen edge, skewed toward 0 (densest at the very edge)
    const edge = Math.random() ** 1.6;
    const offset = Math.floor(edge * (band - len));
    const col =
      Math.random() < 0.5 ? offset : Math.max(0, this.cols - len - offset);

    this.segments.push({
      row,
      col,
      chars: this.makeText(len),
      filled,
      edge,
      dieAt: now + 50 + Math.random() ** 2 * 700,
      nextScramble: now + 40 + Math.random() * 120,
    });
  }

  /** Corrupted fragments of the configured words, like the reference's "HEADLESS" -> "HEADLR S". */
  private makeText(len: number): string[] {
    const { words } = this.options;
    const out: string[] = [];

    while (out.length < len) {
      const word = words.length
        ? (words[(Math.random() * words.length) | 0] ?? "")
        : "";
      const src = [...word.toUpperCase()];
      const start = src.length ? (Math.random() * src.length) | 0 : 0;

      for (let i = start; i < src.length && out.length < len; i++) {
        const r = Math.random();
        out.push(r < 0.22 ? randomGlyph() : r < 0.3 ? " " : (src[i] ?? " "));
      }
      if (out.length < len) out.push(Math.random() < 0.5 ? " " : "·");
    }
    return out;
  }

  private scramble(seg: Segment): void {
    for (let i = 0; i < seg.chars.length; i++) {
      if (Math.random() < 0.35) seg.chars[i] = randomGlyph();
    }
  }

  // ---- loop --------------------------------------------------------------

  private sync(): void {
    if (this.visible && !this.reduced) {
      if (this.rafId) return;
      this.nextSpawnAt = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
      this.render(); // static frame
    }
  }

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);

    try {
      if (now - this.nextSpawnAt > 500) this.nextSpawnAt = now; // after a stall

      const gap = 1000 / this.options.intensity;
      while (now >= this.nextSpawnAt) {
        const burst = Math.random() < 0.12 ? 4 + ((Math.random() * 7) | 0) : 1;
        for (let i = 0; i < burst; i++) this.spawn(now);
        this.nextSpawnAt += -Math.log(1 - Math.random()) * gap;
      }

      let kept = 0;
      for (const seg of this.segments) {
        if (now >= seg.dieAt) continue;
        if (now >= seg.nextScramble) {
          this.scramble(seg);
          seg.nextScramble = now + 40 + Math.random() * 140;
        }
        this.segments[kept++] = seg;
      }
      this.segments.length = kept;

      this.render();
    } catch (e){
      { console.error(e); }
    }
  };

  private render(): void {
    const { ctx, dpr, cellW, cellH, width, height } = this;
    const { fontSize, paper, ink, dim } = this.options;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px ${this.family}`;
    ctx.textBaseline = "alphabetic";

    for (const seg of this.segments) {
      const x = seg.col * cellW;
      const y = seg.row * cellH;

      ctx.globalAlpha = (0.35 + 0.65 * this.weight(seg.row)) * (1 - 0.7 * seg.edge);

      if (seg.filled) {
        ctx.fillStyle = paper;
        ctx.fillRect(x, y, seg.chars.length * cellW, cellH);
        ctx.fillStyle = ink;
      } else {
        ctx.fillStyle = dim;
      }

      for (let i = 0; i < seg.chars.length; i++) {
        const ch = seg.chars[i];
        if (ch && ch !== " ") ctx.fillText(ch, x + i * cellW, y + cellH * 0.76);
      }
    }
    ctx.globalAlpha = 1;
  }
}
