'use client';

import { useEffect, useState } from 'react';

const COMPACT_QUERY = '(max-width: 767px), (max-height: 480px)';
const MAX_DIAL_RADIUS = 190;

export interface NavigationLayout {
  // False until mounts on client side
  ready: boolean;
  isCompact: boolean;
  viewportWidth: number;
  // min(44vw, 190px)
  dialRadius: number;
}

const INITIAL: NavigationLayout = {
  ready: false,
  isCompact: false,
  viewportWidth: 0,
  dialRadius: MAX_DIAL_RADIUS,
};

export function useNavigationLayout(): NavigationLayout {
  const [layout, setLayout] = useState<NavigationLayout>(INITIAL);

  useEffect(() => {
    const mql = window.matchMedia(COMPACT_QUERY);

    const update = () => {
      const viewportWidth = document.documentElement.clientWidth;
      const next: NavigationLayout = {
        ready: true,
        isCompact: mql.matches,
        viewportWidth,
        dialRadius: Math.min(viewportWidth * 0.44, MAX_DIAL_RADIUS),
      };
      setLayout((prev) =>
        prev.ready === next.ready &&
        prev.isCompact === next.isCompact &&
        prev.viewportWidth === next.viewportWidth
          ? prev
          : next,
      );
    };

    update();
    mql.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      mql.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return layout;
}
