import Galaxy from "@/components/backgrounds/Galaxy";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          backgroundColor: "#07060B",
        }}
      >
        <Galaxy
          starColors={["#F3EFF9", "#C4B2E0", "#A855F7", "#896ABD"]}
          backgroundColor="#07060B"
          transparent={false}
          density={1.1}
          glowIntensity={0.35}
          twinkleIntensity={0.35}
          starSpeed={0.4}
          rotationSpeed={0.08}
          mouseInteraction
          mouseRepulsion
          repulsionStrength={2}
          clickWarp={false}
        />
      </div>

      <section className="relative z-10 grid min-h-dvh place-items-center px-6 pt-24">
        <div className="border border-white/15 bg-black/40 px-10 py-8 text-center backdrop-blur-sm">
          <h1 className="text-4xl text-neutral-100">{site.name}</h1>
        </div>
      </section>
    </>
  );
}
