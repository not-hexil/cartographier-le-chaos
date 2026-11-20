'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Transition,
} from 'framer-motion';
import { Menu, X, type LucideIcon } from 'lucide-react';
import { useNavigationLayout, type NavigationLayout } from '@/hooks/useNavigationLayout';
import {
  GROUP_FIRST_INDEX,
  GROUP_HOTKEY,
  GROUP_ITEMS,
  GROUP_LABEL,
  NAV_ITEMS,
  type NavGroup,
  type NavItem,
} from '@/lib/navigation';

// Tokens
const SURFACE =
  'bg-neutral-100/85 backdrop-blur-md border-neutral-900/10 text-neutral-900 shadow-lg shadow-neutral-900/5 ' +
  'dark:bg-neutral-900/85 dark:border-white/10 dark:text-neutral-100 dark:shadow-xl dark:shadow-black/40';

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ' +
  'dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-neutral-950';

const ACTIVE = 'bg-indigo-100 text-indigo-950 dark:bg-indigo-950/90 dark:text-indigo-100';

const STATE_LAYER =
  'pointer-events-none absolute inset-0 rounded-[inherit] transition-colors ' +
  'group-hover:bg-neutral-900/5 dark:group-hover:bg-white/10';

const AMBIENT = 'bg-neutral-900/[0.04] dark:bg-white/[0.05]';

// Desktop quarter circles
const TRIGGER = 80;
const DESKTOP_SURFACE = 260;
const DESKTOP_NODE_R = 200;
const NODE_W = 56;
const NODE_H = 48;
const STAGGER = 0.03;
const SPRING: Transition = { type: 'spring', stiffness: 380, damping: 30 };

// Compact semi-circle
const FAB = 56;
const FAB_INSET = 24;
const ARC_STEP = 32; // degrees between items
const FULL_VISIBLE = 4;
const FIRST_SLOT_ANGLE = 90 - 1.5 * ARC_STEP; // 42deg: leftmost full slot at rest
const MAX_WINDOW = NAV_ITEMS.length - FULL_VISIBLE; // 3 -> 4 snap stops
const MAX_ROT = MAX_WINDOW * ARC_STEP; // 96deg
const SNAP_PX = 120; // scroll px per window step
const ITEM_RADIUS_RATIO = 0.8;
const EDGE_MASK = 'linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%)';

const SHAPES = [
  { w: 28, h: 28, round: 'rounded-full', left: 0.18, top: 0.58, px: -30, rot: 20 },
  { w: 36, h: 36, round: 'rounded-xl', left: 0.76, top: 0.32, px: 24, rot: -35 },
  { w: 64, h: 22, round: 'rounded-full', left: 0.58, top: 0.64, px: -40, rot: 15 },
  { w: 20, h: 20, round: 'rounded-full', left: 0.34, top: 0.14, px: 18, rot: 0 },
  { w: 44, h: 44, round: 'rounded-2xl', left: 0.06, top: 0.2, px: 36, rot: -25 },
  { w: 52, h: 18, round: 'rounded-full', left: 0.84, top: 0.72, px: -28, rot: 30 },
] as const;

// helpers
const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const windowFor = (i: number) => clamp(i - 1, 0, MAX_WINDOW); // Dial window/leftmost full slot index that centeres item i where possible

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') !== null
  );
}

function cycleFocus(list: (HTMLElement | null)[], direction: 1 | -1) {
  const items = list.filter((el): el is HTMLElement => el !== null);
  if (items.length === 0) return;
  const idx = items.findIndex((el) => el === document.activeElement);
  const next = idx === -1 ? (direction === 1 ? 0 : items.length - 1) : (idx + direction + items.length) % items.length;
  items[next].focus({ preventScroll: true });
}

function arrowDirection(key: string): 1 | -1 | 0 {
  if (key === 'ArrowRight' || key === 'ArrowDown') return 1;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return -1;
  return 0;
}

// Shared Functions
function IconSwap({ open, reduced, Closed }: { open: boolean; reduced: boolean; Closed: LucideIcon }) {
  return (
    <span className="relative flex h-6 w-6 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={open ? 'close' : 'open'}
          className="flex"
          initial={reduced ? { opacity: 0 } : { opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, rotate: 90 }}
          transition={{ duration: reduced ? 0.1 : 0.14 }}
        >
          {open ? (
            <X aria-hidden size={24} strokeWidth={1.75} />
          ) : (
            <Closed aria-hidden size={24} strokeWidth={1.75} />
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  linkRef: (el: HTMLAnchorElement | null) => void;
  onNavigate: () => void;
  onFocus?: () => void;
}

function NavLink({ item, active, linkRef, onNavigate, onFocus }: NavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      ref={linkRef}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      onFocus={onFocus}
      className={`group flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-medium leading-none whitespace-nowrap ${FOCUS}`}
    >
      <span
        className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
          active ? ACTIVE : 'group-hover:bg-neutral-900/5 dark:group-hover:bg-white/10'
        }`}
      >
        <Icon aria-hidden size={24} strokeWidth={1.75} />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

// Desktop Quarter Circle
interface CornerMenuProps {
  group: NavGroup;
  side: 'left' | 'right';
  open: boolean;
  focusToken: number;
  pathname: string;
  reduced: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
  onClose: () => void;
}

function CornerMenu({ group, side, open, focusToken, pathname, reduced, triggerRef, onToggle, onClose }: CornerMenuProps) {
  const items = GROUP_ITEMS[group];
  const isLeft = side === 'left';
  const menuId = useId();
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Moves focus to the first item when toggling hotkey
  useEffect(() => {
    if (open) linkRefs.current[0]?.focus({ preventScroll: true });
  }, [open, focusToken]);

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      triggerRef.current?.focus();
      return;
    }
    const dir = arrowDirection(e.key);
    if (dir === 0) return;
    e.preventDefault();
    cycleFocus(linkRefs.current.slice(0, items.length), dir);
  };

  return (
    <>
      {/* One always-mounted surface: width, height and radius animate together, so it is a true quarter circle every frame. */}
      <motion.div
        aria-hidden
        data-radial-nav
        className={`pointer-events-none fixed top-0 z-40 ${
          isLeft ? 'left-0 border-b border-r' : 'right-0 border-b border-l'
        } ${SURFACE}`}
        initial={false}
        animate={{
          width: open ? DESKTOP_SURFACE : TRIGGER,
          height: open ? DESKTOP_SURFACE : TRIGGER,
          [isLeft ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: open ? DESKTOP_SURFACE : TRIGGER,
        }}
        transition={reduced ? { duration: 0.12 } : SPRING}
      />

      <AnimatePresence>
        {open && (
          <motion.nav
            key="nodes"
            id={menuId}
            aria-label={`${GROUP_LABEL[group]} navigation`}
            data-radial-nav
            onKeyDown={handleKeyDown}
            className={`pointer-events-none fixed top-0 z-40 ${isLeft ? 'left-0' : 'right-0'}`}
            style={{ width: DESKTOP_SURFACE, height: DESKTOP_SURFACE }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <ul className="absolute inset-0 m-0 list-none p-0">
              {items.map((item, i) => {
                const t = items.length === 1 ? 0.5 : i / (items.length - 1);
                const angle = isLeft ? 15 + 60 * t : 165 - 60 * t;
                const originX = isLeft ? 0 : DESKTOP_SURFACE;
                const cx = originX + DESKTOP_NODE_R * Math.cos(rad(angle));
                const cy = DESKTOP_NODE_R * Math.sin(rad(angle));
                return (
                  <motion.li
                    key={item.href}
                    className="pointer-events-auto absolute"
                    style={{ left: cx - NODE_W / 2, top: cy - NODE_H / 2, width: NODE_W, height: NODE_H }}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: originX - cx, y: -cy }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    transition={reduced ? { duration: 0.12 } : { ...SPRING, delay: 0.05 + i * STAGGER }}
                  >
                    <NavLink
                      item={item}
                      active={isActive(pathname, item.href)}
                      linkRef={(el) => {
                        linkRefs.current[i] = el;
                      }}
                      onNavigate={onClose}
                    />
                  </motion.li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>

      <button
        ref={triggerRef}
        type="button"
        data-radial-nav
        aria-label={`${GROUP_LABEL[group]} menu`}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-keyshortcuts={GROUP_HOTKEY[group]}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        className={`group fixed top-0 z-50 flex flex-col gap-1 p-3 ${
          isLeft ? 'left-0 items-start rounded-br-[80px]' : 'right-0 items-end rounded-bl-[80px]'
        } ${FOCUS}`}
        style={{ width: TRIGGER, height: TRIGGER }}
      >
        <span aria-hidden className={STATE_LAYER} />
        <span className={`relative flex items-center gap-1 ${isLeft ? '' : 'flex-row-reverse'}`}>
          <IconSwap open={open} reduced={reduced} Closed={Menu} />
          <kbd
            className={`rounded border border-neutral-900/15 px-1 font-sans text-[10px] leading-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-white/20 ${
              open ? 'hidden' : ''
            }`}
          >
            {GROUP_HOTKEY[group]}
          </kbd>
        </span>
        <span className="relative text-[10px] font-semibold tracking-[0.14em]">{GROUP_LABEL[group]}</span>
      </button>
    </>
  );
}

// Compact Semi Circle
function AmbientShape({
  shape,
  rot,
  radius,
  reduced,
}: {
  shape: (typeof SHAPES)[number];
  rot: MotionValue<number>;
  radius: number;
  reduced: boolean;
}) {
  const x = useTransform(rot, [0, MAX_ROT], [0, shape.px]);
  const rotate = useTransform(rot, [0, MAX_ROT], [0, shape.rot]);
  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none absolute ${shape.round} ${AMBIENT}`}
      style={{
        width: shape.w,
        height: shape.h,
        left: shape.left * radius * 2,
        top: shape.top * radius,
        ...(reduced ? {} : { x, rotate }),
      }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.12 : 0.5, delay: reduced ? 0 : 0.15 }}
    />
  );
}

function GroupTick({ rot, radius }: { rot: MotionValue<number>; radius: number }) {
  const rho = radius * ITEM_RADIUS_RATIO;
  const phi = useTransform(rot, (r) => FIRST_SLOT_ANGLE + (GROUP_ITEMS.base.length - 0.5) * ARC_STEP - r);
  const x = useTransform(phi, (p) => radius - rho * Math.cos(rad(p)));
  const y = useTransform(phi, (p) => radius - rho * Math.sin(rad(p)));
  const rotate = useTransform(phi, (p) => p - 90);
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 bg-neutral-900/15 dark:bg-white/20"
      style={{ x, y, rotate, width: 1, height: 44, marginLeft: -0.5, marginTop: -22 }}
    />
  );
}

interface DialItemProps {
  item: NavItem;
  index: number;
  active: boolean;
  rot: MotionValue<number>;
  radius: number;
  linkRef: (el: HTMLAnchorElement | null) => void;
  onNavigate: () => void;
  onFocus: () => void;
}

function DialItem({ item, index, active, rot, radius, linkRef, onNavigate, onFocus }: DialItemProps) {
  const rho = radius * ITEM_RADIUS_RATIO;
  // 0deg = left end of the arc, 90deg = top centre, 180deg = right end.
  const theta = useTransform(rot, (r) => FIRST_SLOT_ANGLE + index * ARC_STEP - r);
  const x = useTransform(theta, (t) => radius - rho * Math.cos(rad(t)));
  const y = useTransform(theta, (t) => radius - rho * Math.sin(rad(t)));
  const opacity = useTransform(theta, (t) => (t < -14 || t > 194 ? 0 : 1));

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ x, y, opacity, width: NODE_W, height: NODE_H, marginLeft: -NODE_W / 2, marginTop: -NODE_H / 2 }}
    >
      <NavLink item={item} active={active} linkRef={linkRef} onNavigate={onNavigate} onFocus={onFocus} />
    </motion.div>
  );
}

interface RotaryDialProps {
  id: string;
  activeGroup: NavGroup;
  focusToken: number;
  pathname: string;
  reduced: boolean;
  radius: number;
  onClose: () => void;
  onEscape: () => void;
}

function RotaryDial({ id, activeGroup, focusToken, pathname, reduced, radius, onClose, onEscape }: RotaryDialProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const windowRef = useRef(0);
  const settleRef = useRef(0);

  const { scrollX } = useScroll({ container: trackRef });
  const rot = useTransform(scrollX, [0, MAX_WINDOW * SNAP_PX], [0, MAX_ROT], { clamp: true });

  const scrollToWindow = useCallback(
    (w: number) => {
      const next = clamp(w, 0, MAX_WINDOW);
      windowRef.current = next;
      trackRef.current?.scrollTo({
        left: next * SNAP_PX,
        behavior: reduced ? 'auto' : 'smooth',
      });
    },
    [reduced],
  );

  // Hotkey / open: rotate to the group's window and focus its first item.
  useEffect(() => {
    const idx = GROUP_FIRST_INDEX[activeGroup];
    scrollToWindow(windowFor(idx));
    linkRefs.current[idx]?.focus({ preventScroll: true });
  }, [activeGroup, focusToken, scrollToWindow]);
    useEffect(() => () => window.clearTimeout(settleRef.current), []);

  // Tab / arrow focus on an edge or masked item rotates it into the centre slots.
  const handleItemFocus = (i: number) => {
      const w = windowRef.current;
      if (i >= w + 1 && i <= w + 2) return;
      const target = clamp(i < w + 1 ? i - 1 : i - 2, 0, MAX_WINDOW);
      if (target !== w) scrollToWindow(target);
    };

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onEscape();
      return;
    }
    const dir = arrowDirection(e.key);
    if (dir === 0) return;
    e.preventDefault();
    cycleFocus(linkRefs.current, dir);
  };

  return (
    <motion.nav
      id={id}
      aria-label="Primary navigation"
      onKeyDown={handleKeyDown}
            className="absolute left-0 top-0 [&_a:focus]:ring-2 [&_a:focus]:ring-indigo-600 [&_a:focus]:ring-offset-2 [&_a:focus]:ring-offset-neutral-50 dark:[&_a:focus]:ring-indigo-400 dark:[&_a:focus]:ring-offset-neutral-950"
      style={{ width: radius * 2, height: radius }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.15, delay: reduced ? 0 : 0.12 } }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
    >
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          window.clearTimeout(settleRef.current);
          settleRef.current = window.setTimeout(() => {
            windowRef.current = clamp(Math.round(el.scrollLeft / SNAP_PX), 0, MAX_WINDOW);
          }, 150);
        }}
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) trackRef.current?.scrollBy({ left: e.deltaY });
        }}
        className="absolute inset-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="relative h-full" style={{ width: radius * 2 + MAX_WINDOW * SNAP_PX }}>
          {Array.from({ length: MAX_WINDOW + 1 }, (_, k) => (
            <span
              key={k}
              aria-hidden
              className={`absolute top-0 h-px w-px snap-start ${reduced ? 'snap-always' : ''}`}
              style={{ left: k * SNAP_PX }}
            />
          ))}

          {/* Sticky layer: stays put while the track scrolls underneath; items are descendants of the
              scroller so swipes that start on an item still scroll. overflow-clip (not hidden) so focus
              can never scroll this box. */}
          <div
            className="sticky left-0 h-full overflow-clip"
            style={{ width: radius * 2, maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
          >
            {SHAPES.map((shape, i) => (
              <AmbientShape key={i} shape={shape} rot={rot} radius={radius} reduced={reduced} />
            ))}
            <GroupTick rot={rot} radius={radius} />
            {NAV_ITEMS.map((item, i) => (
              <DialItem
                key={item.href}
                item={item}
                index={i}
                active={isActive(pathname, item.href)}
                rot={rot}
                radius={radius}
                linkRef={(el) => {
                  linkRefs.current[i] = el;
                }}
                onNavigate={onClose}
                onFocus={() => handleItemFocus(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

interface CompactNavProps {
  layout: NavigationLayout;
  activeGroup: NavGroup | null;
  focusToken: number;
  pathname: string;
  reduced: boolean;
  fabRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
  onClose: () => void;
}

function CompactNav({ layout, activeGroup, focusToken, pathname, reduced, fabRef, onToggle, onClose }: CompactNavProps) {
  const open = activeGroup !== null;
  const R = layout.dialRadius;
  const vw = layout.viewportWidth;
  const dialId = useId();

  const fabLeft = vw - FAB_INSET - FAB;
  const dockDx = vw / 2 - FAB / 2 - fabLeft;

  const variants = {
    closed: {
      width: FAB,
      height: FAB,
      x: fabLeft,
      y: -FAB_INSET,
      borderTopLeftRadius: FAB / 2,
      borderTopRightRadius: FAB / 2,
      borderBottomLeftRadius: FAB / 2,
      borderBottomRightRadius: FAB / 2,
    },
    open: {
      width: R * 2,
      height: R,
      x: vw / 2 - R,
      y: 0,
      borderTopLeftRadius: R,
      borderTopRightRadius: R,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
  };

  const morph: Transition = reduced
    ? { duration: 0 }
    : { type: 'spring', stiffness: 380, damping: 32, x: { type: 'spring', stiffness: 240, damping: 30 } };

  return (
    <>
      <motion.div
        data-radial-nav
        className={`fixed bottom-0 left-0 z-40 overflow-clip border ${SURFACE}`}
        variants={variants}
        initial={false}
        animate={open ? 'open' : 'closed'}
        transition={morph}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        <AnimatePresence>
          {activeGroup && (
            <RotaryDial
              key={R} // remount on radius change; item transforms close over it
              id={dialId}
              activeGroup={activeGroup}
              focusToken={focusToken}
              pathname={pathname}
              reduced={reduced}
              radius={R}
              onClose={onClose}
              onEscape={() => {
                onClose();
                fabRef.current?.focus();
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button
        ref={fabRef}
        type="button"
        data-radial-nav
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        aria-controls={open ? dialId : undefined}
        onClick={onToggle}
        onKeyDown={(e) => {
                  if (!open) return;
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                    return;
                  }
                  const dir = arrowDirection(e.key);
                  if (dir === 0) return;
                  e.preventDefault();
                  const links = document.getElementById(dialId)?.querySelectorAll<HTMLElement>('a');
                  if (links?.length) links[dir === 1 ? 0 : links.length - 1].focus({ preventScroll: true });
                }}
        className={`group fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full transition-colors ${
          open ? ACTIVE : 'text-neutral-900 dark:text-neutral-100'
        } ${FOCUS}`}
        style={{ width: FAB, height: FAB }}
        initial={false}
        animate={
          reduced
            ? { x: open ? dockDx : 0, y: open ? 12 : 0 }
            : open
              ? { x: dockDx, y: [null, -36, 12] }
              : { x: 0, y: [null, -36, 0] }
        }
        transition={
          reduced
            ? { duration: 0 }
            : { x: { type: 'spring', stiffness: 240, damping: 30 }, y: { duration: 0.5, ease: 'easeInOut' } }
        }
      >
        <span aria-hidden className={STATE_LAYER} />
        <span className="relative">
          <IconSwap open={open} reduced={reduced} Closed={Menu} />
        </span>
      </motion.button>
    </>
  );
}

// Root
export function MaterialRadialNav() {
  const layout = useNavigationLayout();
  const reduced = !!useReducedMotion();
  const pathname = usePathname();

  const [activeMenu, setActiveMenu] = useState<NavGroup | null>(null);
  const [focusToken, setFocusToken] = useState(0);

  const inTriggerRef = useRef<HTMLButtonElement>(null);
  const formTriggerRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const openGroup = useCallback((group: NavGroup) => {
    setActiveMenu(group);
    setFocusToken((t) => t + 1);
  }, []);
  const close = useCallback(() => setActiveMenu(null), []);

  // Collapse on route change and when switching between desktop/compact layouts.
  useEffect(() => setActiveMenu(null), [pathname]);
  useEffect(() => setActiveMenu(null), [layout.isCompact]);

  // Global keybinds
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      const group: NavGroup | null = e.key === '[' ? 'base' : e.key === ']' ? 'index' : null;
      if (!group || isEditableTarget(e.target)) return;
      e.preventDefault();

      const isOpen = layout.isCompact ? activeMenu !== null : activeMenu === group;

            if (isOpen) {
              setActiveMenu(null);
              const trigger = layout.isCompact ? fabRef : group === 'base' ? inTriggerRef : formTriggerRef;
              requestAnimationFrame(() => trigger.current?.focus());
            } else {
              openGroup(layout.isCompact ? 'base' : group);
            }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMenu, layout.isCompact, openGroup]);

  // Click / tap outside closes.
  useEffect(() => {
    if (!activeMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Element && !e.target.closest('[data-radial-nav]')) setActiveMenu(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [activeMenu]);

  if (!layout.ready) return null;

  if (layout.isCompact) {
    return (
      <CompactNav
        layout={layout}
        activeGroup={activeMenu}
        focusToken={focusToken}
        pathname={pathname}
        reduced={reduced}
        fabRef={fabRef}
        onToggle={() => (activeMenu ? close() : openGroup('base'))}
        onClose={close}
      />
    );
  }

  return (
    <>
      <CornerMenu
        group="base"
        side="left"
        open={activeMenu === 'base'}
        focusToken={focusToken}
        pathname={pathname}
        reduced={reduced}
        triggerRef={inTriggerRef}
        onToggle={() => (activeMenu === 'base' ? close() : openGroup('base'))}
        onClose={close}
      />
      <CornerMenu
        group="index"
        side="right"
        open={activeMenu === 'index'}
        focusToken={focusToken}
        pathname={pathname}
        reduced={reduced}
        triggerRef={formTriggerRef}
        onToggle={() => (activeMenu === 'index' ? close() : openGroup('index'))}
        onClose={close}
      />
    </>
  );
}

export default MaterialRadialNav;
