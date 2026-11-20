import {
  Compass,
  Feather,
  Home,
  Library,
  Mail,
  Newspaper,
  User,
  type LucideIcon,
} from 'lucide-react';

export type NavGroup = 'base' | 'index';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroup;
}

// The compact dial renders this array as one continuous arc.
// Order of entries matters: base first, index later.
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', href: '/', icon: Home, group: 'base' },
  { label: 'About', href: '/about', icon: User, group: 'base' },
  { label: 'Contact', href: '/contact', icon: Mail, group: 'base' },
  { label: 'Books', href: '/books', icon: Library, group: 'index' },
  { label: 'Articles', href: '/articles', icon: Newspaper, group: 'index' },
  { label: 'Literature', href: '/literature', icon: Feather, group: 'index' },
  { label: 'Interpretation', href: '/interpretation', icon: Compass, group: 'index' },
];

export const GROUP_ITEMS: Record<NavGroup, readonly NavItem[]> = {
  base: NAV_ITEMS.filter((item) => item.group === 'base'),
  index: NAV_ITEMS.filter((item) => item.group === 'index'),
};

export const GROUP_LABEL: Record<NavGroup, string> = { base: 'BASE', index: 'INDEX' };

export const GROUP_HOTKEY: Record<NavGroup, string> = { base: '[', index: ']' };

// Index into NAV_ITEMS of the first item of each group.
export const GROUP_FIRST_INDEX: Record<NavGroup, number> = {
  base: 0,
  index: GROUP_ITEMS.base.length,
};
