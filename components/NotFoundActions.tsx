"use client";

// import Link from "next/link";
import { useRouter } from "next/navigation";

const BUTTON =
  "border border-neutral-600 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.3em] text-neutral-300 transition-colors hover:border-[#d9d7d1] hover:bg-[#d9d7d1] hover:text-[#0b0b0b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d9d7d1]";

export function NotFoundActions() {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
      <button type="button" onClick={goBack} className={BUTTON}>
        Go back
      </button>
      <a href="/" className={BUTTON}>
        Go home
      </a>
    </div>
  );
}
