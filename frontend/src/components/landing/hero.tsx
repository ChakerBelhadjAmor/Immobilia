"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const suggestions = [
  "T3 lumineux à Lyon, budget 450 k€, proche marché",
  "Louer un 2 pièces vue mer à Marseille",
  "Où investir 200 k€ pour du locatif ?",
];

export function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (q: string) => {
    router.push(`/recherche?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="relative overflow-hidden bg-navy-950">
      {/* Gold architectural line-art, echoing the logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 items-end justify-end opacity-[0.13] lg:flex"
      >
        <Image
          src="/brand/logo.png"
          alt=""
          width={900}
          height={693}
          className="h-[85%] w-auto translate-x-24 object-contain"
          priority
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/4 size-[500px] rounded-full bg-gold-500/8 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-4 pt-28 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-gold-300">
            <Sparkles className="size-3.5" aria-hidden />
            L&rsquo;immobilier augmenté par l&rsquo;intelligence artificielle
          </p>
          <h1 className="mt-7 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-sand-50 text-balance sm:text-6xl lg:text-7xl">
            Le bon bien.
            <br />
            Le juste prix.
            <br />
            <span className="text-gold-400">En toute confiance.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-300/85">
            Immobil&rsquo;IA analyse chaque annonce, détecte les arnaques,
            estime les prix au plus juste et vous accompagne — que vous
            vendiez, cherchiez ou investissiez.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 max-w-2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) submit(query.trim());
            }}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm sm:flex-row"
          >
            <label htmlFor="hero-search" className="sr-only">
              Décrivez le bien que vous cherchez
            </label>
            <input
              id="hero-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Décrivez votre recherche : « 3 pièces calme à Paris, 1 M€, proche parc… »"
              className="h-12 flex-1 rounded-xl bg-transparent px-4 text-sand-100 placeholder:text-sand-300/40 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold-500 px-6 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
            >
              Rechercher
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-sand-300/70 transition-colors hover:border-gold-500/40 hover:text-gold-300"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8"
        >
          {[
            { value: "41 jours", label: "délai de vente moyen" },
            { value: "184 000+", label: "analyses IA réalisées" },
            { value: "96 %", label: "d'arnaques détectées" },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="tnum font-display text-2xl font-semibold text-sand-50 sm:text-3xl">
                {stat.value}
              </dd>
              <dd className="mt-1 text-xs text-sand-300/60 sm:text-sm">
                {stat.label}
              </dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
