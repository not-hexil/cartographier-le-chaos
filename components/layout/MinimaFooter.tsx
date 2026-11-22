import Link from "next/link";
import type { CSSProperties } from "react";
import { FOOTER_LINKS } from "@/lib/footer";
import { CrowdCanvas } from "@/components/layout/CrowdCanvas";
import { Avatar } from "@/components/layout/Avatar";
import { WordRings } from "@/components/WordRings";
import { GlitchStrip } from "@/components/layout/GlitchSctrip";

export interface FooterLinkItem {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterProps {
  className?: string;
}

const ease = (t: number) => t * t * (3 - 2 * t);

// top/bottom = percent of stage height used by each ramp
function easedFade(top: number, bottom: number, steps = 12): string {
  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    stops.push(`rgba(0,0,0,${ease(t).toFixed(3)}) ${(t * top).toFixed(2)}%`);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    stops.push(
      `rgba(0,0,0,${ease(t).toFixed(3)}) ${(100 - t * bottom).toFixed(2)}%`
    );
  }
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
}

// Fade Mask
const FADE = easedFade(32, 22);

const stageStyle: CSSProperties = {
  maskImage: FADE,
  WebkitMaskImage: FADE,
};

const linkClass =
  "text-xs tracking-wide text-neutral-500 transition-colors hover:text-neutral-300";

export function Footer({ className }: FooterProps) {
  return (
    <footer className={`relative w-full ${className ?? ""}`}>
      <GlitchStrip className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 w-full" />
      {/* muted white stage, faded top and bottom into the page background */}
      <div
        className="relative h-[34rem] w-full overflow-hidden bg-[#d9d7d1]"
        style={stageStyle}
      >
        <WordRings className="absolute inset-0 h-full w-full" />
        <CrowdCanvas className="absolute inset-0" splitRatio={0.6}>
          {/* STUB */}
          <Avatar />
        </CrowdCanvas>
      </div>

      <nav
        aria-label="Footer"
        className="relative z-10 -mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 px-6 pb-8"
      >
        {FOOTER_LINKS.map(({ label, href, external }) =>
          external ? (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {label}
            </a>
          ) : (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          )
        )}
      </nav>
    </footer>
  );
}
