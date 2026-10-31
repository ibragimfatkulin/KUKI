import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Header, MobileNav } from "@/components/header";
import "./globals.css";

const sans = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });
const display = Cormorant_Garamond({ subsets: ["latin", "cyrillic"], weight: ["500", "600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: "KUKI",
    template: "%s — KUKI",
  },
  description: "Расскажите, что есть в холодильнике, а мы придумаем ужин из этих продуктов.",
};

export const viewport: Viewport = {
  themeColor: "#FAF8F3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${sans.variable} ${display.variable} min-h-dvh bg-cream font-sans text-ink antialiased`}>
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
          К содержанию
        </a>
        <Header />
        <main id="content" className="pb-24 md:pb-12">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
