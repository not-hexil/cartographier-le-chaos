import LiquidChrome from '../../../components/backgrounds/LiquidChrome';
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <div style={{ width: '100vw', height: '100vh', position: 'fixed' }}>
      <LiquidChrome
        color="#896abd"
        speed={0.2}
        amplitude={0.3}
        detail={4}
        thickness={1}
        interactive
        frequencyX={3}
        frequencyY={3}
        depth={1}
        roughness={0.3}
        exposure={1}
        rippleStrength={1}
        rippleSize={1}
        tilt={1}
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
