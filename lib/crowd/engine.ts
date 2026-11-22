import { CROWD_CONFIG, getTier, type Tier } from "@/lib/crowd/config"
import { Peep, type Stage } from "@/lib/crowd/peep";
import { getDpr } from "../canvas";

export interface CrowdEngineOptions {
  src: string;
  columns: number;
  rows: number;
  splitRatio: number;
}

const MAX_DT = 0.1; // clamp after tab/background pauses

export class CrowdEngine {
  private readonly image = new Image();
  private readonly motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  private all: Peep[] = [];
  private available: Peep[] = [];
  private crowd: Peep[] = [];

  private stage: Stage = { width: 0, height: 0 };
  private dpr = 1;
  private tier: Tier = getTier(0);
  private splitY = 0;

  private ready = false;
  private visible = true;
  private reduced = this.motionQuery.matches;
  private destroyed = false;

  private rafId = 0;
  private last = 0;
  private resizeTimer: number | undefined;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private readonly backCtx: CanvasRenderingContext2D;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
      private readonly backCanvas: HTMLCanvasElement,
      private readonly canvas: HTMLCanvasElement,
      private readonly options: CrowdEngineOptions
    ) {
      const back = backCanvas.getContext("2d");
      const front = canvas.getContext("2d");
      if (!back || !front) throw new Error("2D canvas context unavailable");
      this.backCtx = back;
      this.ctx = front;
    }

  start(): void {
    this.image.onload = () => {
      if (this.destroyed) return;
      this.createPeeps();
      this.ready = true;
      this.rebuild();
      this.observe();
      this.sync();
    };
    this.image.src = this.options.src;
  }

  destroy(): void {
    this.destroyed = true;
    this.stopLoop();
    window.clearTimeout(this.resizeTimer);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.motionQuery.removeEventListener("change", this.onMotionChange);
    this.image.onload = null;
    this.all = [];
    this.available = [];
    this.crowd = [];
  }

  // ---- setup -------------------------------------------------------------

  private createPeeps(): void {
    const { columns, rows } = this.options;
    const cellW = this.image.naturalWidth / columns;
    const cellH = this.image.naturalHeight / rows;

    for (let i = 0; i < columns * rows; i++) {
      this.all.push(
        new Peep(this.image, [
          (i % columns) * cellW,
          Math.floor(i / columns) * cellH,
          cellW,
          cellH,
        ])
      );
    }
  }

  private observe(): void {
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this.canvas);

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry?.isIntersecting ?? true;
      this.sync();
    });
    this.intersectionObserver.observe(this.canvas);

    this.motionQuery.addEventListener("change", this.onMotionChange);
  }

  // ---- events ------------------------------------------------------------

  private onResize = (): void => {
    const { clientWidth, clientHeight } = this.canvas;
    const unchanged =
      clientWidth === this.stage.width &&
      clientHeight === this.stage.height &&
      getDpr() === this.dpr;
    if (unchanged) return;

    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (this.destroyed) return;
      this.rebuild();
      if (!this.rafId) this.render();
    }, 150);
  };

  private onMotionChange = (e: MediaQueryListEvent): void => {
    this.reduced = e.matches;
    this.sync();
  };

  // ---- crowd -------------------------------------------------------------

  private rebuild(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;

    this.dpr = getDpr();
    this.stage = { width, height };
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.tier = getTier(width);
    this.backCanvas.width = this.canvas.width;
    this.backCanvas.height = this.canvas.height;

    // anchorY spans [height - h + offsetA - offsetB, height - h + offsetA]
    const peepHeight = this.all[0]?.height ?? 0;
    this.splitY =
      height -
      peepHeight +
      this.tier.offsetA -
      this.tier.offsetB * (1 - this.options.splitRatio);

    this.crowd = [];
    this.available = [...this.all];
    while (this.available.length) this.spawn(true);
    this.sortCrowd();
  }

  private spawn(randomProgress: boolean): void {
    const index = Math.floor(Math.random() * this.available.length);
    const peep = this.available.splice(index, 1)[0];
    if (!peep) return;

    peep.reset(this.stage, this.tier, randomProgress ? Math.random() : 0);
    this.crowd.push(peep);
  }

  /** Lower anchorY draws first (further back). */
  private sortCrowd(): void {
    this.crowd.sort((a, b) => a.anchorY - b.anchorY);
  }

  // ---- loop --------------------------------------------------------------

  private sync(): void {
    if (!this.ready) return;
    if (this.visible && !this.reduced) {
      this.startLoop();
    } else {
      this.stopLoop();
      this.render(); // static frame
    }
  }

  private startLoop(): void {
    if (this.rafId) return;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick); // schedule first: a throw must not kill the loop
    const dt = Math.min((now - this.last) / 1000, MAX_DT);
    this.last = now;
    try {
      this.step(dt);
      this.render();
    } catch {
      // retry next frame (e.g. canvas context lost, then restored)
    }
  };

  private step(dt: number): void {
    const finished: Peep[] = [];
    for (const peep of this.crowd) {
      if (peep.advance(dt)) finished.push(peep);
    }
    if (!finished.length) return;

    this.crowd = this.crowd.filter((p) => !finished.includes(p));
    this.available.push(...finished);
    for (let i = 0; i < finished.length; i++) this.spawn(false);
    this.sortCrowd();
  }

  private render(): void {
    const { backCtx, ctx, canvas, dpr, splitY } = this;
    for (const c of [backCtx, ctx]) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, canvas.width, canvas.height);
    }
    for (const peep of this.crowd) {
      peep.draw(peep.anchorY < splitY ? backCtx : ctx, dpr);
    }
  }
}

export { CROWD_CONFIG };
