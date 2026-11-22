"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CROWD_CONFIG } from "@/lib/crowd/config";
import { CrowdEngine } from "@/lib/crowd/engine";

interface CrowdCanvasProps {
  src?: string;
  /** 0..1. Higher = more peeps drawn behind `children`. */
  splitRatio?: number;
  /** Rendered between the back and front crowd layers (the avatar). */
  children?: ReactNode;
  className?: string;
}

const LAYER = "absolute inset-0 h-full w-full";

export function CrowdCanvas({
  src = CROWD_CONFIG.src,
  splitRatio = 0.6,
  children,
  className,
}: CrowdCanvasProps) {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) return;

    const engine = new CrowdEngine(back, front, {
      src,
      columns: CROWD_CONFIG.columns,
      rows: CROWD_CONFIG.rows,
      splitRatio,
    });
    engine.start();

    return () => engine.destroy();
  }, [src, splitRatio]);

  return (
    <div className={className}>
      <canvas ref={backRef} className={LAYER} aria-hidden="true" />
      {children}
      <canvas ref={frontRef} className={LAYER} aria-hidden="true" />
    </div>
  );
}
