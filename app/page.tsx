import AeroShards from "@/components/backgrounds/AeroShards";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <div style={{ width: '100vw', height: '100vh', position: 'fixed' }}>
        <AeroShards
          shardColor="#896ABD"
          accentColor="#A855F7"
          placement="left"
          material="glass"
          markers="plus"
          count={1300}
          depthOfField={0.75}
          vignette={0.3}
          mouseInteraction
          pulseOnClick
          holdToGather
          lightMode={false}
          shardSize={1}
          spread={1}
          twist={1}
          billow={1}
          speed={1}
          scale={1}
          glow={0.35}
          grain={0.06}
          intro
          mouseStrength={0.6}
          parallax={0.5}
          paused={false}
      />
      </div>
      <section className="grid min-h-dvh place-items-center px-6 pt-24">
        <div className="border border-white/15 bg-black/40 px-10 py-8 text-center backdrop-blur-sm">
          <h1 className="text-4xl text-neutral-100">{site.name}</h1>
        </div>
      </section>
    </>
  );
}
