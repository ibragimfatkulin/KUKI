"use client";

import { ChefHat, Heart, History, Refrigerator, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Главная", icon: ChefHat },
  { href: "/history", label: "История", icon: History },
  { href: "/favorites", label: "Избранное", icon: Heart },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

export function Header() {
  const pathname = usePathname();
  const cooking = pathname.startsWith("/cook");

  return (
    <header className="sticky top-0 z-40 border-b border-pine/10 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white">
            <Refrigerator size={20} />
          </span>
          <span>
            <span className="block font-display text-2xl leading-none text-pine">KUKI</span>
            <span className="hidden text-xs text-ink/55 sm:block">из того, что уже дома</span>
          </span>
        </Link>
        {cooking ? (
          <Link href="/" className="text-sm font-semibold text-pine">
            На главную
          </Link>
        ) : (
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                    active ? "bg-pine text-white" : "text-pine hover:bg-white",
                  )}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/cook")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-pine/10 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold",
                  active ? "bg-cream text-accent" : "text-pine",
                )}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
