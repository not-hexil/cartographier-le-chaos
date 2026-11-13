import Antigravity from "@/components/backgrounds/AntiGravity";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <div style={{ width: '100vw', height: '100vh', position: 'fixed' }}>
        <Antigravity
            colors={["#896abd","#a855f7","#B497CF"]}
            count={1500}
            magnetRadius={9}
            ringRadius={7}
            particleSize={0.9}
            autoAnimate
            colorMode="conic"
            colorSpeed={0.05}
            particleShape="capsule"
            particleVariance={1}
            fieldStrength={10}
            waveAmplitude={1}
            waveCount={3}
            waveSpeed={0.4}
            rotationSpeed={0}
            pulseSpeed={3}
            depthFactor={1}
            ambient={0.25}
            lerpSpeed={0.05}
            interactive
            clickBurst
            intro
            lightMode={false}
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
