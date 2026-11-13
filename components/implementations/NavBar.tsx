'use client';

import React, { isValidElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowDown01Icon, Atom01Icon, User02Icon } from '@hugeicons/core-free-icons';

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode | IconSvgElement;
  iconOnly?: boolean;
}

export interface NavBarProps {
  brandIcon?: ReactNode | IconSvgElement;
  brandHref?: string;
  aboutIcon?: ReactNode | IconSvgElement;
  aboutHref?: string;
  items?: NavItem[];
}

const BOOKS = [
  {
    title: 'Aquamarine',
    subtitle: 'Full-length novel',
    href: '/le-chaos-apprivoise/aquamarine'
  },
  {
    title: 'Je Suis Le Chaos',
    subtitle: 'Full-length novel',
    href: '/le-chaos-apprivoise/je-suis-le-chaos'
  }
];

const DEFAULT_SEGMENTS: NavItem[] = [
  { label: 'Al-Hawashi', href: '/al-hawashi' },
  { label: "Ma'na & Maghza", href: '/mana-and-maghza' },
  { label: 'Hikayat Al-Gharib', href: '/hikayat-al-gharib' },
  { label: 'Fikr and Fana', href: '/fikr-and-fana' }
];

const renderIcon = (icon: ReactNode | IconSvgElement, size = 18) =>
  isValidElement(icon) ? icon : <HugeiconsIcon icon={icon as IconSvgElement} size={size} strokeWidth={1.8} />;

// Slightly transparent dark obsidian for the main floating pill & medallions
const mainGlassStyle: CSSProperties = {
  backgroundColor: 'rgba(18, 16, 26, 0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 10px 32px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
};

// More transparent frosted glass for the dropdown card
const dropdownGlassStyle: CSSProperties = {
  backgroundColor: 'rgba(18, 16, 26, 0.38)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(168, 85, 247, 0.25)',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
};

export default function NavBar({
  brandIcon = Atom01Icon,
  brandHref = '/',
  aboutIcon = User02Icon,
  aboutHref = '/about',
  items = DEFAULT_SEGMENTS
}: NavBarProps) {
  const pathname = usePathname();
  const [booksOpen, setBooksOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isChaosActive = pathname?.startsWith('/le-chaos-apprivoise');
  const isAboutActive = pathname === aboutHref;

  const closeMenus = () => {
    setBooksOpen(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBooksOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenus();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="pointer-events-none fixed top-6 right-0 left-0 z-50 flex flex-col items-center px-4">
      <nav
        aria-label="Main navigation"
        className="pointer-events-auto flex items-center gap-3"
      >
        {/* 1. Left Detached Circular Brand / Home Medallion */}
        <Link
          href={brandHref}
          onClick={closeMenus}
          aria-label="Home"
          title="Home"
          style={mainGlassStyle}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 hover:border-purple-400/40 ${
            pathname === brandHref ? 'text-[#A855F7]' : 'text-[#F3F0F8]'
          }`}
        >
          {renderIcon(brandIcon, 20)}
        </Link>

        {/* 2. Desktop Floating Pill Track */}
        <div
          style={mainGlassStyle}
          className="hidden items-center gap-1 rounded-full p-1.5 lg:flex"
        >
          {/* Le Chaos Apprivoisé (with Books Dropdown) */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setBooksOpen(true)}
            onMouseLeave={() => setBooksOpen(false)}
          >
            <div
              className={`flex items-center rounded-full transition-all duration-200 ${
                isChaosActive
                  ? 'bg-[#F3F0F8] text-[#0B0A10] shadow-sm'
                  : 'text-[#F3F0F8]/80 hover:bg-white/[0.06] hover:text-[#F3F0F8]'
              }`}
            >
              <Link
                href="/le-chaos-apprivoise"
                onClick={closeMenus}
                className="py-2 pl-4 pr-1.5 text-sm font-medium whitespace-nowrap"
              >
                Le Chaos Apprivoisé
              </Link>
              <button
                type="button"
                onClick={() => setBooksOpen(prev => !prev)}
                aria-expanded={booksOpen}
                aria-label="Toggle books menu"
                className="cursor-pointer py-2 pr-3 pl-0.5 opacity-75 transition-opacity hover:opacity-100"
              >
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  strokeWidth={2.2}
                  className={`transition-transform duration-200 ${booksOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* More Transparent Frosted Glass Books Dropdown (Text-only) */}
            <div
              className={`absolute top-full left-0 pt-3 transition-all duration-200 ${
                booksOpen
                  ? 'pointer-events-auto translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1.5 opacity-0'
              }`}
            >
              <div
                className="w-60 rounded-2xl p-1.5"
                style={dropdownGlassStyle}
              >
                {BOOKS.map(book => {
                  const active = pathname === book.href;
                  return (
                    <Link
                      key={book.href}
                      href={book.href}
                      onClick={closeMenus}
                      className={`flex flex-col rounded-xl px-3.5 py-2.5 transition-colors ${
                        active
                          ? 'bg-purple-500/20 text-[#F3F0F8]'
                          : 'text-[#F3F0F8]/90 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <span className={`text-sm font-medium ${active ? 'text-[#C084FC]' : ''}`}>
                        {book.title}
                      </span>
                      <span className="text-xs text-[#F3F0F8]/55">{book.subtitle}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Remaining Segments */}
          {items.map(item => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenus}
                aria-label={item.label}
                title={item.iconOnly ? item.label : undefined}
                className={`flex items-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  item.iconOnly ? 'p-2.5' : 'px-4 py-2'
                } ${
                  active
                    ? 'bg-[#F3F0F8] text-[#0B0A10] shadow-sm'
                    : 'text-[#F3F0F8]/80 hover:bg-white/[0.06] hover:text-[#F3F0F8]'
                }`}
              >
                {item.icon ? <span className="inline-flex shrink-0">{renderIcon(item.icon, 16)}</span> : null}
                {!item.iconOnly && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* 3. Mobile Floating Pill Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
          style={mainGlassStyle}
          className="flex h-12 items-center gap-3 rounded-full px-5 text-sm font-medium text-[#F3F0F8] lg:hidden"
        >
          <span>{mobileOpen ? 'Close' : 'Segments'}</span>
          <div className="relative flex h-3.5 w-4 flex-col items-center justify-center">
            <span
              className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-transform duration-200 ${
                mobileOpen ? 'rotate-45 text-[#A855F7]' : '-translate-y-1'
              }`}
            />
            <span
              className={`absolute h-[1.5px] w-4 rounded-full bg-current transition-transform duration-200 ${
                mobileOpen ? '-rotate-45 text-[#A855F7]' : 'translate-y-1'
              }`}
            />
          </div>
        </button>

        {/* 4. Right Detached Circular About Medallion */}
        <Link
          href={aboutHref}
          onClick={closeMenus}
          aria-label="About"
          title="About"
          style={mainGlassStyle}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 hover:border-purple-400/40 ${
            isAboutActive ? 'text-[#A855F7]' : 'text-[#F3F0F8]'
          }`}
        >
          {renderIcon(aboutIcon, 20)}
        </Link>
      </nav>

      {/* Mobile Dropdown Card */}
      {mobileOpen && (
        <div
          style={dropdownGlassStyle}
          className="pointer-events-auto mt-3 w-full max-w-sm rounded-3xl p-4 lg:hidden"
        >
          <div className="flex flex-col gap-1.5">
            <Link
              href="/le-chaos-apprivoise"
              onClick={closeMenus}
              className={`rounded-full px-4 py-2.5 text-sm font-medium ${
                isChaosActive ? 'bg-[#F3F0F8] text-[#0B0A10]' : 'text-[#F3F0F8]'
              }`}
            >
              Le Chaos Apprivoisé
            </Link>
            <div className="my-1 ml-4 flex flex-col gap-1 border-l border-purple-500/30 pl-3">
              {BOOKS.map(book => (
                <Link
                  key={book.href}
                  href={book.href}
                  onClick={closeMenus}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    pathname === book.href
                      ? 'bg-purple-500/20 text-[#C084FC]'
                      : 'text-[#F3F0F8]/75 hover:text-white'
                  }`}
                >
                  {book.title}
                </Link>
              ))}
            </div>

            {items.map(item => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium ${
                    active ? 'bg-[#F3F0F8] text-[#0B0A10]' : 'text-[#F3F0F8]/85 hover:text-white'
                  }`}
                >
                  {item.icon ? renderIcon(item.icon, 16) : null}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
