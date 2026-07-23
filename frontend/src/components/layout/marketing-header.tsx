"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/recherche", label: "Rechercher" },
  { href: "/carte", label: "Carte" },
  { href: "/espace/vendeur", label: "Vendre" },
  { href: "/espace/investisseur", label: "Investir" },
  { href: "/outils/decoration", label: "Outils IA" },
];

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-navy-800/60 bg-navy-950/90 backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo variant="light" />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-sand-200/85 transition-colors hover:bg-white/5 hover:text-sand-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/connexion"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-sand-200/85 transition-colors hover:text-sand-50"
          >
            Connexion
          </Link>
          <Link href="/inscription">
            <Button variant="gold" size="sm" tabIndex={-1}>
              Créer un compte
            </Button>
          </Link>
        </div>
        <button
          className="rounded-lg p-2 text-sand-100 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-b border-navy-800 bg-navy-950/95 backdrop-blur-md lg:hidden"
            aria-label="Navigation mobile"
          >
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-sand-200 hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-3">
                <Link href="/connexion" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full border-sand-300/30 text-sand-100 hover:bg-white/5 hover:border-sand-300/60" tabIndex={-1}>
                    Connexion
                  </Button>
                </Link>
                <Link href="/inscription" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="gold" className="w-full" tabIndex={-1}>
                    Créer un compte
                  </Button>
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
