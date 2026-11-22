const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const CROWD_CONFIG = {
  src: `${BASE_PATH}/images/open-peeps-sheet.avif`,
  columns: 15,
  rows: 7,
  walkSeconds: 10,
  bobSeconds: 0.25,
  bobPx: 10,
  speedMin: 0.5,
  speedMax: 1.5,
} as const;

export interface Tier {
  scale: number;
  offsetA: number;
  offsetB: number;
}

const MOBILE: Tier = { scale: 0.35, offsetA: 240, offsetB: 100 };
const TABLET: Tier = { scale: 0.5, offsetA: 200, offsetB: 150 };
const DESKTOP: Tier = { scale: 1, offsetA: 100, offsetB: 250 };

export const getTier = (width: number): Tier =>
  width < 480 ? MOBILE : width < 960 ? TABLET : DESKTOP;
