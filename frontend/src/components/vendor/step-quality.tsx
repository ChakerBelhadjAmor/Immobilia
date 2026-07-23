"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { QualityScoreResult } from "@/types";
import type { ListingDraft } from "./wizard-types";
import { computeQualityScore } from "@/services/ai-service";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { cn } from "@/lib/utils";

/** EF-V-07 — listing quality score with concrete improvement suggestions. */
export function StepQuality({ draft }: { draft: ListingDraft }) {
  const [result, setResult] = useState<QualityScoreResult | null>(null);

  useEffect(() => {
    computeQualityScore({
      photoCount: draft.photoCount,
      descriptionLength: draft.description.length,
      hasVideo: draft.hasVideo,
      priceSet: draft.price > 0,
    }).then(setResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-sand-100 p-4 text-sm text-navy-600">
        <Loader2 className="size-4 animate-spin text-gold-600" aria-hidden />
        Calcul du score de qualité de l&rsquo;annonce…
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
      <div className="flex flex-col items-center rounded-card border border-sand-200 bg-white p-6">
        <ScoreGauge value={result.score} label="Score de qualité" size={140} tone="gold" />
        <p className="mt-4 max-w-52 text-center text-xs text-navy-500">
          Le score progresse à mesure que vous suivez les recommandations
          ci-contre.
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-navy-900">
          Suggestions concrètes d&rsquo;amélioration
        </h3>
        <ul className="mt-3 space-y-2.5">
          {result.suggestions.map((s) => (
            <li
              key={s.label}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3.5 text-sm",
                s.done
                  ? "border-success-500/30 bg-success-50 text-success-700"
                  : "border-sand-200 bg-white text-navy-700",
              )}
            >
              {s.done ? (
                <CheckCircle2 className="size-4.5 shrink-0" aria-hidden />
              ) : (
                <Circle className="size-4.5 shrink-0 text-navy-300" aria-hidden />
              )}
              <span className="flex-1">{s.label}</span>
              <span
                className={cn(
                  "tnum shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                  s.done ? "bg-success-500/15" : "bg-gold-100 text-gold-700",
                )}
              >
                +{s.impact} pts
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
