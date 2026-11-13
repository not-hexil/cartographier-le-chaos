'use client';

import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import BranchedMenu, { type BranchedMenuProps } from '../ui/BranchedMenu';

const glassStyle: CSSProperties = {
  backgroundColor: 'rgba(11, 10, 16, 0.72)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(168, 85, 247, 0.28)',
  boxShadow: '0 12px 44px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
};

// Map each menu `value` to its actual route path in your app
const ROUTE_MAP: Record<string, string> = {
  aquamarine: '/le-chaos-apprivoise/aquamarine',
  'je-suis-le-chaos': '/le-chaos-apprivoise/je-suis-le-chaos',
  sada: '/al-hawashi/sada',
  khayal: '/al-hawashi/khayal',
  khatirat: '/al-hawashi/khatirat',
  'lecho-discordant': '/mana-and-maghza/lecho-discordant',
  'toiles-pensives': '/mana-and-maghza/toiles-pensives',
  'hikayat-al-gharib': '/hikayat-al-gharib',
  'fikr-and-fana': '/fikr-and-fana'
};

export interface TogglableMenuProps extends BranchedMenuProps {
  defaultMenuOpen?: boolean;
  closeOnSelect?: boolean;
}

export default function Menu({
  defaultMenuOpen = false,
  closeOnSelect = true,
  onSelect,
  width = 480,
  rowHeight = 58,
  indent = 58,
  trunk = 22,
  radius = 16,
  lineWidth = 2.2,
  fontSize = 23,
  ...menuProps
}: TogglableMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultMenuOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed top-8 right-8 z-50 flex flex-col items-end gap-4">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        style={glassStyle}
        className="group flex h-20 cursor-pointer items-center gap-4 rounded-full px-7 text-[#F3F0F8] transition-all duration-300 hover:border-purple-400/50 active:scale-95"
      >
        <span className="text-lg font-medium tracking-widest uppercase text-[#F3F0F8]/90 group-hover:text-white">
          {isOpen ? 'Close' : 'Segments'}
        </span>
        <div className="relative flex h-6 w-8 flex-col items-center justify-center">
          <span
            className={`absolute h-[2.5px] w-8 rounded-full bg-[#F3F0F8] transition-all duration-300 ${
              isOpen ? 'rotate-45 bg-[#A855F7]' : '-translate-y-2.5'
            }`}
          />
          <span
            className={`absolute h-[2.5px] w-8 rounded-full bg-[#F3F0F8] transition-all duration-300 ${
              isOpen ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute h-[2.5px] w-8 rounded-full bg-[#F3F0F8] transition-all duration-300 ${
              isOpen ? '-rotate-45 bg-[#A855F7]' : 'translate-y-2.5'
            }`}
          />
        </div>
      </button>

      <div
        style={glassStyle}
        className={`max-h-[calc(100vh-9rem)] origin-top-right overflow-y-auto rounded-3xl p-8 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-3 scale-95 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <BranchedMenu
          width={width}
          rowHeight={rowHeight}
          indent={indent}
          trunk={trunk}
          radius={radius}
          lineWidth={lineWidth}
          fontSize={fontSize}
          {...menuProps}
          onSelect={(value, item) => {
            onSelect?.(value, item);
            const targetPath = ROUTE_MAP[value] ?? `/${value}`;
            router.push(targetPath);
            if (closeOnSelect) setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
}
