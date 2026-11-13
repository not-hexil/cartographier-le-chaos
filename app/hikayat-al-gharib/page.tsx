import Lightfall from "@/components/backgrounds/Lightfall";
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
        <Lightfall
          colors={["#F3EFF9", "#C4B2E0", "#A855F7", "#896ABD"]}
          backgroundColor="#896ABD"
          baseColor="#07060B"
          speed={0.3}
          streakCount={3}
          streakWidth={0.85}
          streakLength={1.1}
          twinkle={0.35}
          backgroundGlow={0.18}
          headGlow={0.65}
          bloom={0.4}
          density={0.65}
          glow={1.1}
          depth={0.5}
          zoom={3}
          mouseInteraction
          mouseStrength={0.4}
          mouseRadius={0.45}
          lens={0.5}
          holdToWarp
          intro
          fade={0}
          lightMode={false}
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
