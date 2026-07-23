"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Wrench } from "lucide-react";
import type { RepairFinding } from "@/types";
import { repairFindings } from "@/data/tools";
import { UploadDropzone } from "./upload-dropzone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatPrice } from "@/lib/utils";

const severityBadge: Record<RepairFinding["severity"], "danger" | "warning" | "sand"> = {
  error: "danger",
  warning: "warning",
  info: "sand",
};

/** EF-T-04 — repair estimation from photos, impacting score and price. */
export function RepairsPageClient() {
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RepairFinding[] | null>(null);

  const analyze = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setResults(repairFindings);
    setLoading(false);
  };

  const totalCostLow = results?.reduce((a, r) => a + r.estimatedCost[0], 0) ?? 0;
  const totalCostHigh = results?.reduce((a, r) => a + r.estimatedCost[1], 0) ?? 0;
  const totalScoreImpact = results?.reduce((a, r) => a + r.scoreImpact, 0) ?? 0;
  const totalPriceImpact = results?.reduce((a, r) => a + r.priceImpact, 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Estimation de réparations par IA
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          Téléversez des photos du bien : l&rsquo;IA détecte les besoins de
          réparation (humidité, fissures, usure) et répercute son estimation
          sur le score de qualité et le prix.
        </p>
      </header>

      <div className="mt-6">
        <UploadDropzone uploaded={uploaded} onUpload={() => setUploaded(true)} />
      </div>

      <div className="mt-5 flex justify-center">
        <Button onClick={analyze} loading={loading} disabled={!uploaded}>
          <Wrench className="size-4" aria-hidden />
          Analyser les photos
        </Button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-sand-200 bg-white p-10 text-center">
            <Loader2 className="size-6 animate-spin text-gold-600" aria-hidden />
            <p className="text-sm text-navy-500">
              Détection des zones à risque (humidité, fissures, usure)…
            </p>
          </div>
        ) : !results ? (
          <EmptyState
            icon={<Wrench className="size-6" aria-hidden />}
            title="Aucune analyse pour l'instant"
            description="Téléversez des photos du bien pour détecter les besoins de réparation."
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-card border border-sand-200 bg-white p-4 text-center shadow-card">
                <p className="tnum font-display text-xl font-semibold text-navy-900">
                  {formatPrice(totalCostLow)} — {formatPrice(totalCostHigh)}
                </p>
                <p className="mt-1 text-xs text-navy-400">Coût estimé des travaux</p>
              </div>
              <div className="rounded-card border border-sand-200 bg-white p-4 text-center shadow-card">
                <p className="tnum font-display text-xl font-semibold text-danger-600">
                  {totalScoreImpact} pts
                </p>
                <p className="mt-1 text-xs text-navy-400">Impact sur le score qualité</p>
              </div>
              <div className="rounded-card border border-sand-200 bg-white p-4 text-center shadow-card">
                <p className="tnum font-display text-xl font-semibold text-danger-600">
                  {formatPrice(totalPriceImpact)}
                </p>
                <p className="mt-1 text-xs text-navy-400">Ajustement du prix estimé</p>
              </div>
            </div>

            <ul className="space-y-3">
              {results.map((finding) => (
                <li
                  key={finding.id}
                  className="flex gap-3 rounded-card border border-sand-200 bg-white p-4 shadow-card"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      finding.severity === "error"
                        ? "bg-danger-500 text-white"
                        : finding.severity === "warning"
                          ? "bg-warning-500 text-white"
                          : "bg-sand-200 text-navy-500",
                    )}
                  >
                    <AlertTriangle className="size-4.5" aria-hidden />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-navy-900">
                        {finding.zone}
                      </h3>
                      <Badge variant={severityBadge[finding.severity]}>
                        {finding.severity === "error"
                          ? "Urgent"
                          : finding.severity === "warning"
                            ? "À surveiller"
                            : "Mineur"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-navy-500">{finding.issue}</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-navy-400">
                      <span className="tnum">
                        Coût estimé : {formatPrice(finding.estimatedCost[0])} —{" "}
                        {formatPrice(finding.estimatedCost[1])}
                      </span>
                      <span className="tnum">Score : {finding.scoreImpact} pts</span>
                      {finding.priceImpact !== 0 && (
                        <span className="tnum">
                          Prix : {formatPrice(finding.priceImpact)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
