import { AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { Neighborhood } from "@/types";
import { cn } from "@/lib/utils";

const scoreRows: { key: keyof Neighborhood["score"]; label: string }[] = [
  { key: "securite", label: "Sécurité" },
  { key: "transport", label: "Transports" },
  { key: "bruit", label: "Calme" },
  { key: "commerces", label: "Commerces" },
  { key: "ecoles", label: "Écoles" },
];

/** Neighborhood quality panel with EF-L-05 alert when flagged. */
export function NeighborhoodScorePanel({
  neighborhood,
  compact = false,
}: {
  neighborhood: Neighborhood;
  compact?: boolean;
}) {
  const TrendIcon =
    neighborhood.trend === "hausse"
      ? TrendingUp
      : neighborhood.trend === "baisse"
        ? TrendingDown
        : Minus;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-navy-900">
            {neighborhood.name}
          </h3>
          <p className="text-xs text-navy-400">{neighborhood.city}</p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "tnum font-display text-xl font-semibold",
              neighborhood.score.overall >= 70
                ? "text-success-600"
                : neighborhood.score.overall >= 55
                  ? "text-warning-600"
                  : "text-danger-600",
            )}
          >
            {neighborhood.score.overall}
            <span className="text-xs font-normal text-navy-400">/100</span>
          </p>
          <p className="tnum flex items-center justify-end gap-1 text-xs text-navy-500">
            <TrendIcon className="size-3.5" aria-hidden />
            {neighborhood.pricePerSqm.toLocaleString("fr-FR")} €/m²
          </p>
        </div>
      </div>

      {neighborhood.flagged && (
        <div
          role="alert"
          className="mt-3 flex gap-2.5 rounded-lg border border-warning-500/30 bg-warning-50 p-3"
        >
          <AlertTriangle className="size-4 shrink-0 text-warning-600" aria-hidden />
          <p className="text-xs leading-relaxed text-warning-700">
            <strong className="font-semibold">Quartier signalé.</strong>{" "}
            {neighborhood.flagReason}
          </p>
        </div>
      )}

      {!compact && (
        <dl className="mt-4 space-y-2.5">
          {scoreRows.map((row) => {
            const value = neighborhood.score[row.key];
            return (
              <div key={row.key} className="flex items-center gap-3">
                <dt className="w-24 shrink-0 text-xs text-navy-500">
                  {row.label}
                </dt>
                <dd className="flex flex-1 items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-200"
                    role="img"
                    aria-label={`${row.label} : ${value} sur 100`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full",
                        value >= 70
                          ? "bg-success-500"
                          : value >= 55
                            ? "bg-gold-500"
                            : "bg-danger-500",
                      )}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="tnum w-7 text-right text-xs font-semibold text-navy-700">
                    {value}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}
