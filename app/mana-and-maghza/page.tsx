import WebThreads from "@/components/backgrounds/WebThreads";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <div style={{ width: '100vw', height: '100vh', position: 'fixed' }}>
        <WebThreads
          colors={["#5227FF","#FF9FFC"]}
          coreColor="#FFFFFF"
          threadCount={6}
          spread={0.18}
          lightMode={false}
          speed={0.2}
          frequency={5}
          taper={1}
          position={0.5}
          pinch={0.5}
          nodes={1}
          angle={0}
          glow={0.02}
          falloff={0.6}
          thickness={1.1}
          brightness={0.6}
          opacity={1}
          depth={0}
          pulses={0}
          mirror
          shimmer={false}
          fade={0}
          grain={0.05}
          intro
          mouseInteraction
          mouseStrength={0.5}
          pulseOnClick
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
