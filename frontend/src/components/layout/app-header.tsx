"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Heart, Menu, Scale3d, X } from "lucide-react";
import { Logo } from "./logo";
import { currentUser } from "@/data/users";
import { notifications } from "@/data/community";
import { useCompareList, useFavorites } from "@/hooks/use-local-list";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/recherche", label: "Rechercher" },
  { href: "/carte", label: "Carte" },
  { href: "/comparer", label: "Comparer" },
  { href: "/colocation", label: "Colocation" },
  { href: "/espace/vendeur", label: "Espace vendeur" },
  { href: "/espace/investisseur", label: "Espace investisseur" },
  { href: "/outils/decoration", label: "Outils IA" },
];

/** Light sticky header used on every application page (non-landing). */
export function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const favorites = useFavorites();
  const compare = useCompareList();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-sand-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo variant="dark" />
        <nav
          className="hidden items-center gap-0.5 xl:flex"
          aria-label="Navigation principale"
        >
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-navy-800/5 text-navy-900"
                    : "text-navy-500 hover:bg-navy-800/5 hover:text-navy-800",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/comparer"
            className="relative rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-800/5 hover:text-navy-800"
            aria-label={`Comparateur (${compare.ids.length} biens)`}
          >
            <Scale3d className="size-5" aria-hidden />
            {compare.ids.length > 0 && (
              <span className="tnum absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                {compare.ids.length}
              </span>
            )}
          </Link>
          <Link
            href="/favoris"
            className="relative rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-800/5 hover:text-navy-800"
            aria-label={`Favoris (${favorites.ids.length})`}
          >
            <Heart className="size-5" aria-hidden />
            {favorites.ids.length > 0 && (
              <span className="tnum absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                {favorites.ids.length}
              </span>
            )}
          </Link>
          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-navy-500 transition-colors hover:bg-navy-800/5 hover:text-navy-800"
            aria-label={`Notifications (${unread} non lues)`}
          >
            <Bell className="size-5" aria-hidden />
            {unread > 0 && (
              <span className="tnum absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
          <Link
            href="/profil"
            className="ml-1 hidden items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-navy-800/5 sm:flex"
            aria-label="Mon profil"
          >
            <Image
              src={currentUser.avatarUrl}
              alt=""
              width={30}
              height={30}
              className="size-7.5 rounded-full"
            />
            <span className="text-sm font-medium text-navy-800">
              {currentUser.firstName}
            </span>
          </Link>
          <button
            className="rounded-lg p-2 text-navy-700 xl:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-sand-200 bg-sand-50 xl:hidden"
            aria-label="Navigation mobile"
          >
            <div className="space-y-0.5 px-4 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium",
                    pathname.startsWith(link.href)
                      ? "bg-navy-800/5 text-navy-900"
                      : "text-navy-600 hover:bg-navy-800/5",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/profil"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-800/5 sm:hidden"
              >
                Mon profil
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
