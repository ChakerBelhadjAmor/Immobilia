"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, ScanSearch } from "lucide-react";
import type { DescriptionIssue } from "@/types";
import type { ListingDraft } from "./wizard-types";
import { verifyDescription } from "@/services/ai-service";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const severityStyle: Record<DescriptionIssue["severity"], { icon: typeof Info; classes: string }> = {
  error: { icon: AlertTriangle, classes: "bg-danger-50 text-danger-700" },
  warning: { icon: AlertTriangle, classes: "bg-warning-50 text-warning-700" },
  info: { icon: Info, classes: "bg-navy-50 text-navy-600" },
};

/** EF-V-01 (description) + EF-V-05 (consistency verification). */
export function StepDescription({
  draft,
  onChange,
}: {
  draft: ListingDraft;
  onChange: (patch: Partial<ListingDraft>) => void;
}) {
  const [issues, setIssues] = useState<DescriptionIssue[] | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    const result = await verifyDescription({
      description: draft.description,
      surface: draft.surface,
      rooms: draft.rooms,
      photoCount: draft.photoCount,
    });
    setIssues(result);
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <Textarea
        label="Description complète du bien"
        required
        hint={`${draft.description.length} caractères — 600+ recommandés`}
        placeholder="Décrivez le bien : pièces, prestations, exposition, classe énergétique, charges, proximité des commerces et transports…"
        className="min-h-48"
        value={draft.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />

      <div className="rounded-card border border-sand-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
              <ScanSearch className="size-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-navy-900">
                Vérification IA de la description
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-navy-500">
                Détecte les incohérences entre description, photos et
                caractéristiques, ainsi que les informations manquantes.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={analyze}
            loading={loading}
            disabled={draft.description.length < 10}
          >
            Analyser
          </Button>
        </div>

        {loading && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-sand-100 p-4 text-sm text-navy-600">
            <Loader2 className="size-4 animate-spin text-gold-600" aria-hidden />
            Recoupement de la description, des photos et des caractéristiques…
          </div>
        )}

        {issues && !loading && (
          <ul className="mt-4 space-y-2.5">
            {issues.map((issue, i) => {
              const style = severityStyle[issue.severity];
              const Icon = style.icon;
              return (
                <li
                  key={i}
                  className={cn(
                    "flex gap-2.5 rounded-lg p-3 text-sm",
                    style.classes,
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    <strong className="font-semibold">{issue.field} — </strong>
                    {issue.message}
                  </span>
                </li>
              );
            })}
            {issues.every((i) => i.severity === "info") && (
              <li className="flex gap-2.5 rounded-lg bg-success-50 p-3 text-sm text-success-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                Aucune incohérence bloquante détectée.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
