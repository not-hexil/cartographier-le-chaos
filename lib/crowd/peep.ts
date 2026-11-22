import { CROWD_CONFIG, type Tier } from "@/lib/crowd/config"

export interface Stage {
  width: number;
  height: number;
}

type Rect = readonly [x: number, y: number, w: number, h: number];

const randomRange = (min: number, max: number) =>
  min + Math.random() * (max - min);

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
const easeInCubic = (t: number) => t * t * t;

export class Peep {
  x = 0;
  y = 0;
  anchorY = 0;
  readonly width: number;
  readonly height: number;

  private scaleX = 1;
  private speed = 1;
  private time = 0;
  private startX = 0;
  private endX = 0;
  private baseY = 0;

  constructor(
    private readonly image: HTMLImageElement,
    private readonly rect: Rect
  ) {
    this.width = rect[2];
    this.height = rect[3];
  }

  /** Place the peep at the start of a new walk. `progress` 0..1 pre-advances it. */
  reset(stage: Stage, tier: Tier, progress: number): void {
    const direction = Math.random() > 0.5 ? 1 : -1;

    // ease skews the random toward low values so more peeps sit lower (hides missing legs)
    const offsetY =
      tier.offsetA - tier.offsetB * easeInCubic(Math.random());
    this.baseY = stage.height - this.height + offsetY;
    this.anchorY = this.baseY;

    if (direction === 1) {
      this.startX = -this.width;
      this.endX = stage.width;
      this.scaleX = tier.scale;
    } else {
      this.startX = stage.width + this.width;
      this.endX = 0;
      this.scaleX = -tier.scale;
    }

    this.speed = randomRange(CROWD_CONFIG.speedMin, CROWD_CONFIG.speedMax);
    this.time = progress * CROWD_CONFIG.walkSeconds;
    this.apply();
  }

  /** Advance by dt seconds. Returns true when the walk has finished. */
  advance(dt: number): boolean {
    this.time += dt * this.speed;
    if (this.time >= CROWD_CONFIG.walkSeconds) return true;
    this.apply();
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, dpr: number): void {
    const scaleY = Math.abs(this.scaleX);
    ctx.setTransform(
      dpr * this.scaleX,
      0,
      0,
      dpr * scaleY,
      dpr * this.x,
      dpr * this.y
    );
    ctx.drawImage(
      this.image,
      this.rect[0],
      this.rect[1],
      this.rect[2],
      this.rect[3],
      0,
      0,
      this.width,
      this.height
    );
  }

  private apply(): void {
    const { walkSeconds, bobSeconds, bobPx } = CROWD_CONFIG;
    this.x = this.startX + (this.endX - this.startX) * (this.time / walkSeconds);

    // yoyo bob: up on the first half-cycle, back down on the second
    const phase = (this.time / bobSeconds) % 2;
    const leg = phase < 1 ? phase : 2 - phase;
    this.y = this.baseY - bobPx * easeOutQuad(leg);
  }
}
