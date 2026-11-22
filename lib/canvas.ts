const MAX_DPR = 2;

export const getDpr = (): number =>
  Math.min(window.devicePixelRatio || 1, MAX_DPR);
