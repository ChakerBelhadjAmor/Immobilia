"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

/** Natural-language search input — EF-L-01. */
export function SearchBar({
  initialQuery = "",
  onSearch,
}: {
  initialQuery?: string;
  onSearch: (query: string) => void;
}) {
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSearch(value.trim());
      }}
      className="flex flex-col gap-2 rounded-2xl border border-sand-300 bg-white p-2 shadow-card focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/20 sm:flex-row"
    >
      <div className="flex flex-1 items-center gap-3 px-3">
        <Sparkles className="size-5 shrink-0 text-gold-600" aria-hidden />
        <label htmlFor="nl-search" className="sr-only">
          Décrivez votre recherche en langage naturel
        </label>
        <input
          id="nl-search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="« Un 3 pièces calme pour télétravailler, budget 450 k€, marché à pied… »"
          className="h-11 w-full bg-transparent text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy-800 px-6 text-sm font-semibold text-sand-50 transition-colors hover:bg-navy-700"
      >
        Rechercher
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  );
}
