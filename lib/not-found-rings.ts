import type { RingSpec, WordRingsOptions } from "@/lib/rings/engine";
const WORDS: readonly (readonly string[])[] = [
  ["LOST", "IN", "THE", "ARCHIVES"],
  ["PAGE", "NOT", "FOUND"],
  ["404", "MISFILED"],
  ["THE", "SHELF", "IS", "EMPTY"],
  ["NO", "SUCH", "ENTRY"],
  ["CATALOGUE", "ERROR"],
];

const RING_COUNT = 16; // increase for ultra-wide / 4K viewports

// Order is inner -> outer. Alternating direction, tapering speed (rad/s).
export const NOT_FOUND_RINGS: readonly RingSpec[] = Array.from(
  { length: RING_COUNT },
  (_, i) => ({
    words: WORDS[i % WORDS.length] ?? [],
    speed: (i % 2 ? -1 : 1) * (0.06 / (1 + i * 0.12)),
  })
);

// Light ink for a dark page. Inner radius leaves a clear disc for the title.
export const NOT_FOUND_RING_OPTIONS: Omit<WordRingsOptions, "rings"> = {
  innerRadius: 230,
  ringStep: 72,
  centerYRatio: 0.5,
  glitchBand: 0.09,
  ink: "rgba(217, 215, 209, 0.38)",
  block: "rgba(217, 215, 209, 0.78)",
  paper: "#0b0b0b", // STUB: match your page background (text on glitch blocks)
};
