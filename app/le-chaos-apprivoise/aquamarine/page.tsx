import { site } from "@/lib/site";
import Balatro from '../../../components/backgrounds/Balatro';

export default function HomePage() {
  return (
    <>
      <div style={{ width: '100vw', height: '100vh', position: 'fixed' }}>
        <Balatro
          color2="#3ee0c8"
          color3="52387d"
          color1="140b22"
          swirl={0.25}
          pixelSize={1.5}
          mouseInteraction
          contrast={3.5}
          lighting={0.7}
          speed={1}
          rotationSpeed={0}
          scale={1}
          detail={6}
          crt={0}
          mouseStrength={1}
          clickSwirl
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
