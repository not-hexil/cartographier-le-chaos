"use client";

import { useEffect, useRef } from "react";
import { FOOTER_RINGS } from "@/lib/rings/footer-words";
import { WordRingsEngine } from "@/lib/rings/engine";

interface WordRingsProps {
  className?: string;
}

export function WordRings({ className }: WordRingsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new WordRingsEngine(canvas, { rings: FOOTER_RINGS });
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
