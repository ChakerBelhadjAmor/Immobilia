"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Palette, Sparkles } from "lucide-react";
import type { DecorationIdea } from "@/types";
import { decorationIdeas } from "@/data/tools";
import { UploadDropzone } from "./upload-dropzone";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/utils";

/** EF-T-01 (ideas from media) + EF-T-02 (budget/preferences constraints). */
export function DecorationPageClient() {
  const [uploaded, setUploaded] = useState(false);
  const [budget, setBudget] = useState(1500);
  const [style, setStyle] = useState("tous");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DecorationIdea[] | null>(null);

  const generate = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1600));
    const filtered = decorationIdeas.filter(
      (idea) =>
        idea.budget <= budget * 1.15 &&
        (style === "tous" || idea.style === style),
    );
    setResults(filtered.length > 0 ? filtered : decorationIdeas.slice(0, 2));
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Idées de décoration par IA
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          Téléversez une photo de la pièce à décorer : l&rsquo;IA propose des
          idées adaptées à votre budget et à vos préférences, dans le
          respect des réglementations (copropriété, location).
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <UploadDropzone uploaded={uploaded} onUpload={() => setUploaded(true)} />
          <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
            <div className="grid gap-4">
              <Input
                label="Budget maximum (€)"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
              <Select
                label="Style préféré"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="tous">Tous les styles</option>
                <option value="Scandinave">Scandinave</option>
                <option value="Japandi">Japandi</option>
                <option value="Bohème">Bohème</option>
                <option value="Contemporain">Contemporain</option>
                <option value="Riviera">Riviera</option>
                <option value="Minimaliste">Minimaliste</option>
              </Select>
            </div>
            <Button
              className="mt-5 w-full"
              onClick={generate}
              loading={loading}
              disabled={!uploaded}
            >
              <Sparkles className="size-4" aria-hidden />
              Générer des idées
            </Button>
            {!uploaded && (
              <p className="mt-2 text-center text-xs text-navy-400">
                Téléversez d&rsquo;abord une photo pour continuer.
              </p>
            )}
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-card border border-sand-200 bg-white p-10 text-center">
              <Loader2 className="size-6 animate-spin text-gold-600" aria-hidden />
              <p className="text-sm text-navy-500">
                Analyse de la pièce et génération de propositions adaptées…
              </p>
            </div>
          ) : !results ? (
            <EmptyState
              icon={<Palette className="size-6" aria-hidden />}
              title="Vos idées apparaîtront ici"
              description="Téléversez une photo, ajustez budget et style, puis lancez la génération."
              className="h-full"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((idea) => (
                <div
                  key={idea.id}
                  className="overflow-hidden rounded-card border border-sand-200 bg-white shadow-card"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={idea.imageUrl}
                      alt={idea.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <Badge variant="gold" className="absolute top-3 left-3 shadow-sm">
                      {idea.style}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-navy-900">
                        {idea.title}
                      </h3>
                      <span className="tnum text-sm font-semibold text-gold-700">
                        {formatPrice(idea.budget)}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {idea.items.map((item) => (
                        <li
                          key={item.label}
                          className="flex justify-between text-xs text-navy-500"
                        >
                          <span>{item.label}</span>
                          <span className="tnum">{formatPrice(item.price)}</span>
                        </li>
                      ))}
                    </ul>
                    {idea.regulationNote && (
                      <p className="mt-3 rounded-lg bg-sand-100 p-2.5 text-[11px] leading-relaxed text-navy-500">
                        {idea.regulationNote}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
