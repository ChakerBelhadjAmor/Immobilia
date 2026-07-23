import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

export function Cta() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/10 blur-3xl"
      />
      <Reveal className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-sand-50 text-balance sm:text-5xl">
          Votre prochain projet immobilier mérite mieux qu&rsquo;une intuition
        </h2>
        <p className="mt-5 text-lg text-sand-300/80">
          Créez un compte gratuit et laissez l&rsquo;IA analyser votre premier
          bien dès aujourd&rsquo;hui.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/inscription"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold-500 px-7 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
          >
            Commencer gratuitement
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/recherche"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 px-7 text-sm font-semibold text-sand-100 transition-colors hover:bg-white/5"
          >
            Explorer les biens
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
