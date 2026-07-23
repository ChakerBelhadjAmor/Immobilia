"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SectionLink {
  href: string;
  label: string;
}

export function SectionTabsNav({ links }: { links: SectionLink[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sections de l'espace"
      className="flex gap-1 overflow-x-auto border-b border-sand-200"
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "text-navy-900" : "text-navy-400 hover:text-navy-700",
            )}
          >
            {link.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
