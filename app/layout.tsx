import type { Metadata } from "next";
import { site } from "@/lib/site";
import "./globals.css";
import Menu from "@/components/implementations/Menu";
import Navbar from "@/components/implementations/NavBar";

export const metadata: Metadata = {
  title: {
    default: site.name,
    template: `%s — ${site.name}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <Navbar/>
        <main className="flex-1">{children}</main>
        {/* <Footer /> */}
      </body>
    </html>
  );
}
