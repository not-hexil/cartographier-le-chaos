import ColorBends from "@/components/backgrounds/ColorBends";
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
        <ColorBends
          colors={["#3B1D6E", "#6D35B8", "#896ABD", "#A855F7"]}
          rotation={90}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          noise={0.12}
          parallax={0.5}
          iterations={1}
          intensity={0.9}
          bandWidth={6}
          transparent={false}
          autoRotate={0}
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
