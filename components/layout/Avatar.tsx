interface AvatarProps {
  src?: string;
  className?: string;
}

const ROOT = "absolute bottom-0 left-1/2 h-[46%] -translate-x-1/2";

export function Avatar({ src, className }: AvatarProps) {
  const root = `${ROOT} ${className ?? ""}`;

  if (src) {
    return (
      <div className={root} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-auto" draggable={false} />
      </div>
    );
  }

  // placeholder silhouette
  return (
    <div className={root} aria-hidden="true">
      <svg viewBox="0 0 200 420" className="h-full w-auto">
        <path
          d="M62 90 C50 40 150 40 138 90 C150 150 160 210 140 260 C120 230 80 230 60 260 C40 210 50 150 62 90 Z"
          fill="#1b1a18"
        />
        <path
          d="M20 420 C20 300 40 190 100 170 C160 190 180 300 180 420 Z"
          fill="#2b2926"
        />
        <rect x="88" y="130" width="24" height="40" fill="#3a3733" />
        <ellipse cx="100" cy="95" rx="34" ry="40" fill="#3a3733" />
        <path
          d="M66 80 C70 52 130 52 134 80 C118 66 90 66 66 80 Z"
          fill="#1b1a18"
        />
      </svg>
    </div>
  );
}
