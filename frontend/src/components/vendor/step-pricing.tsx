"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ChargesRecommendation, PriceRecommendation } from "@/types";
import type { ListingDraft } from "./wizard-types";
import { recommendCharges, recommendPrice } from "@/services/ai-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

/** EF-V-02 (price recommendation) + EF-V-03 (charges recommendation). */
export function StepPricing({
  draft,
  onChange,
}: {
  draft: ListingDraft;
  onChange: (patch: Partial<ListingDraft>) => void;
}) {
  const [priceRec, setPriceRec] = useState<PriceRecommendation | null>(null);
  const [charges, setCharges] = useState<ChargesRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    const [pr, ch] = await Promise.all([
      recommendPrice({
        price: draft.price,
        surface: draft.surface,
        city: draft.city || "France",
        transaction: draft.transaction,
      }),
      draft.transaction === "location"
        ? recommendCharges({ surface: draft.surface, type: draft.type })
        : Promise.resolve(null),
    ]);
    setPriceRec(pr);
    setCharges(ch);
    setLoading(false);
  };

  const verdictStyle =
    priceRec?.verdict === "trop_eleve"
      ? { icon: TrendingUp, classes: "bg-warning-50 text-warning-700" }
      : priceRec?.verdict === "trop_faible"
        ? { icon: TrendingDown, classes: "bg-warning-50 text-warning-700" }
        : { icon: BadgeCheck, classes: "bg-success-50 text-success-700" };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={draft.transaction === "vente" ? "Prix de vente (€)" : "Loyer mensuel (€)"}
          type="number"
          required
          value={draft.price}
          onChange={(e) => onChange({ price: Number(e.target.value) })}
        />
        <div className="flex items-end">
          <Button variant="outline" onClick={analyze} loading={loading} className="w-full">
            <Sparkles className="size-4" aria-hidden />
            Analyser mon prix avec l&rsquo;IA
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-lg bg-sand-100 p-4 text-sm text-navy-600">
          <Loader2 className="size-4 animate-spin text-gold-600" aria-hidden />
          Comparaison avec les transactions récentes du secteur…
        </div>
      )}

      {priceRec && !loading && (
        <div className="rounded-card border border-sand-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wide text-navy-400 uppercase">
                Fourchette de marché estimée
              </p>
              <p className="tnum mt-1 text-lg font-semibold text-navy-900">
                {formatPrice(priceRec.marketLow)} — {formatPrice(priceRec.marketHigh)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium tracking-wide text-navy-400 uppercase">
                Prix recommandé
              </p>
              <p className="tnum mt-1 font-display text-2xl font-semibold text-gold-700">
                {formatPrice(priceRec.recommended)}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "mt-4 flex gap-2.5 rounded-lg p-3.5 text-sm leading-relaxed",
              verdictStyle.classes,
            )}
          >
            <verdictStyle.icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            {priceRec.rationale}
          </div>
          <button
            onClick={() => onChange({ price: priceRec.recommended })}
            className="mt-3 text-xs font-semibold text-gold-700 hover:text-gold-800"
          >
            Appliquer le prix recommandé →
          </button>
        </div>
      )}

      {charges && !loading && (
        <div className="rounded-card border border-sand-200 bg-white p-5">
          <p className="text-sm font-semibold text-navy-900">
            Charges de location recommandées
          </p>
          <p className="tnum mt-1 font-display text-xl font-semibold text-navy-900">
            {formatPrice(charges.monthly)}{" "}
            <span className="text-sm font-normal text-navy-400">/mois</span>
          </p>
          <ul className="mt-3 space-y-1.5">
            {charges.breakdown.map((b) => (
              <li key={b.label} className="flex justify-between text-xs text-navy-500">
                <span>{b.label}</span>
                <span className="tnum font-medium text-navy-700">
                  {formatPrice(b.amount)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex gap-2 text-xs leading-relaxed text-navy-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {charges.note}
          </p>
        </div>
      )}
    </div>
  );
}
