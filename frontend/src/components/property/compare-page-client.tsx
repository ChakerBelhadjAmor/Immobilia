"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Scale3d, Search, Send, X } from "lucide-react";
import type { ComparisonResult, Property } from "@/types";
import { properties } from "@/data/properties";
import { compareProperties } from "@/services/ai-service";
import { useCompareList } from "@/hooks/use-local-list";
import { ChatMessage } from "@/components/chat/chat-message";
import { ComparisonTable } from "@/components/property/comparison-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

/** EF-L-08 — chat-driven multi-property comparison. */
export function ComparePageClient() {
  const compare = useCompareList();
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState(
    "Compare ces biens et dis-moi lequel offre le meilleur rapport qualité-prix.",
  );

  const selected = properties.filter((p) => compare.has(p.id));
  const filteredCandidates = properties
    .filter((p) => !compare.has(p.id))
    .filter((p) =>
      search
        ? `${p.title} ${p.city}`.toLowerCase().includes(search.toLowerCase())
        : true,
    )
    .slice(0, 6);

  const runComparison = async () => {
    if (selected.length < 2) return;
    setLoading(true);
    setResult(null);
    const res = await compareProperties(selected.map((p) => p.id));
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Comparateur multi-biens
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-navy-500">
          Sélectionnez au moins deux biens et demandez à l&rsquo;IA un
          tableau de synthèse : avantages, inconvénients, meilleur rapport
          qualité-prix.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        {/* Sélection des biens */}
        <div className="space-y-4">
          <div className="rounded-card border border-sand-200 bg-white p-4 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Scale3d className="size-4 text-gold-600" aria-hidden />
              Biens sélectionnés ({selected.length})
            </h2>
            {selected.length === 0 ? (
              <p className="mt-3 text-xs text-navy-400">
                Ajoutez des biens depuis la recherche via l&rsquo;icône
                comparateur, ou cherchez-les ci-dessous.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {selected.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-sand-200 p-2.5"
                  >
                    <Image
                      src={p.images[0]}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-navy-800">
                        {p.title}
                      </p>
                      <p className="tnum text-xs text-navy-400">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => compare.remove(p.id)}
                      aria-label="Retirer"
                      className="rounded-md p-1 text-navy-400 hover:bg-sand-100 hover:text-danger-600"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-card border border-sand-200 bg-white p-4 shadow-card">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-navy-300"
                aria-hidden
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chercher un bien à ajouter…"
                className="h-9 w-full rounded-lg border border-sand-300 bg-sand-50 pl-9 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              />
            </div>
            <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
              {filteredCandidates.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => compare.toggle(p.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sand-100"
                  >
                    <Image
                      src={p.images[0]}
                      alt=""
                      width={36}
                      height={36}
                      className="size-9 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-navy-700">
                      {p.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Chat + résultats */}
        <div className="flex flex-col rounded-card border border-sand-200 bg-sand-100/60 shadow-card">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <ChatMessage role="assistant">
              Sélectionnez vos biens à comparer, puis posez-moi votre
              question — je génère un tableau de synthèse complet.
            </ChatMessage>

            {selected.length >= 2 && !result && !loading && (
              <ChatMessage role="user">{question}</ChatMessage>
            )}

            {loading && (
              <ChatMessage role="assistant">
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Analyse comparative de {selected.length} biens en cours…
                </span>
              </ChatMessage>
            )}

            {result && (
              <ChatMessage role="assistant">
                <div className="w-full min-w-0 -mx-1 overflow-x-auto">
                  <div className="min-w-[640px] px-1">
                    <ComparisonTable properties={selected} result={result} />
                  </div>
                </div>
              </ChatMessage>
            )}

            {selected.length > 0 && selected.length < 2 && (
              <div className="mt-2">
                <EmptyState
                  icon={<Scale3d className="size-5" aria-hidden />}
                  title="Ajoutez un second bien"
                  description="La comparaison nécessite au moins deux biens sélectionnés."
                  className="border-none bg-transparent py-6"
                />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runComparison();
            }}
            className="flex gap-2 border-t border-sand-200 bg-white p-3"
          >
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex : lequel a le meilleur rapport qualité-prix ?"
              className="flex-1"
              aria-label="Votre question de comparaison"
            />
            <Button
              type="submit"
              disabled={selected.length < 2}
              loading={loading}
            >
              <Send className="size-4" aria-hidden />
              Comparer
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
