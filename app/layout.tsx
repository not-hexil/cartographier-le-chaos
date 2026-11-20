import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MaterialRadialNav } from '@/components/layout/MaterialRadialNavbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nav test',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        <MaterialRadialNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
