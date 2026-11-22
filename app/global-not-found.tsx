import type { Metadata } from "next";
import { WordRings } from "@/components/WordRings";
import {
  NOT_FOUND_RINGS,
  NOT_FOUND_RING_OPTIONS,
} from "@/lib/not-found-rings";
import { NotFoundActions } from "@/components/NotFoundActions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lost in the archives",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <section className="relative grid min-h-dvh place-items-center overflow-hidden px-6">
          <WordRings
            className="absolute inset-0 h-full w-full"
            rings={NOT_FOUND_RINGS}
            options={NOT_FOUND_RING_OPTIONS}
          />

          <div className="relative z-10 flex flex-col items-center text-center uppercase">
            <span className="mb-4 font-mono text-xs tracking-[0.6em] text-neutral-500">
              404
            </span>

            <h1 className="flex flex-col items-center">
              <span className="text-[clamp(3rem,11vw,7rem)] font-black leading-[0.85] tracking-tight text-transparent [-webkit-text-stroke:1.5px_#d9d7d1]">
                Lost
              </span>

              <span className="my-3 flex items-center gap-3 font-mono text-[clamp(0.6rem,1.4vw,0.85rem)] tracking-[0.55em] text-neutral-400">
                <span className="h-px w-8 bg-neutral-500" aria-hidden="true" />
                in the
                <span className="h-px w-8 bg-neutral-500" aria-hidden="true" />
              </span>

              <span className="text-[clamp(1.6rem,5.2vw,3.4rem)] font-semibold leading-none tracking-[0.18em] text-[#d9d7d1] [text-shadow:2px_0_0_rgba(255,255,255,0.12),-2px_0_0_rgba(0,0,0,0.5)]">
                Archives
              </span>
            </h1>
            <NotFoundActions />
          </div>
        </section>
      </body>
    </html>
  );
}
