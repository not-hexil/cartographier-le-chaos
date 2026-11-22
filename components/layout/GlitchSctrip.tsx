"use client";

import { useEffect, useRef } from "react";
import { FOOTER_RINGS } from "@/lib/rings/footer-words";
import { GlitchStripEngine } from "@/lib/glitch/engine";

const WORDS = FOOTER_RINGS.flatMap((ring) => ring.words);

interface GlitchStripProps {
  className?: string;
}

export function GlitchStrip({ className }: GlitchStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GlitchStripEngine(canvas, { words: WORDS });
    engine.start();

    return () => engine.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`font-mono ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}
