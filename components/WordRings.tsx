"use client";

import { useEffect, useRef } from "react";
import { FOOTER_RINGS } from "@/lib/rings/footer-words";
import {
  WordRingsEngine,
  type RingSpec,
  type WordRingsOptions,
} from "@/lib/rings/engine";

interface WordRingsProps {
  className?: string;
  // Defaults to the footer rings.
  rings?: readonly RingSpec[];
  options?: Omit<WordRingsOptions, "rings">;
}

export function WordRings({
  className,
  rings = FOOTER_RINGS,
  options,
}: WordRingsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

        const engine = new WordRingsEngine(canvas, { ...options, rings });
    engine.start();

    return () => engine.destroy();
  }, [rings, options]);

  return (
    <canvas
      ref={canvasRef}
      className={`font-mono ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}
