export interface FooterLinkItem {
  label: string;
  href: string;
  external?: boolean;
}

export const FOOTER_LINKS: readonly FooterLinkItem[] = [
  { label: "GitHub", href: "https://github.com/not-hexil", external: true },
];
