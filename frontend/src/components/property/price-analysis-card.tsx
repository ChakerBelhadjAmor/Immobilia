import { TrendingDown, TrendingUp, BadgeCheck } from "lucide-react";
import type { Property } from "@/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Inline AI price positioning (buyer view of EF-V-02). */
export function PriceAnalysisCard({ property }: { property: Property }) {
  const delta = Math.round(
    ((property.price - property.aiPriceEstimate) / property.aiPriceEstimate) *
      100,
  );
  const over = delta > 3;
  const under = delta < -3;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-navy-500">Estimation Immobil&rsquo;IA</span>
        <span className="tnum text-sm font-semibold text-navy-900">
          {formatPrice(property.aiPriceEstimate)}
          {property.transaction === "location" && (
            <span className="font-normal text-navy-400"> /mois</span>
          )}
        </span>
      </div>
      <div
        className={cn(
          "mt-2.5 flex items-center gap-2 rounded-lg p-2.5 text-xs font-medium",
          over
            ? "bg-warning-50 text-warning-700"
            : under
              ? "bg-success-50 text-success-700"
              : "bg-success-50 text-success-700",
        )}
      >
        {over ? (
          <TrendingUp className="size-4 shrink-0" aria-hidden />
        ) : under ? (
          <TrendingDown className="size-4 shrink-0" aria-hidden />
        ) : (
          <BadgeCheck className="size-4 shrink-0" aria-hidden />
        )}
        {over
          ? `Prix ${delta} % au-dessus de l'estimation — marge de négociation probable.`
          : under
            ? `Prix ${Math.abs(delta)} % sous l'estimation — opportunité à saisir vite.`
            : "Prix aligné sur le marché : annonce au juste prix."}
      </div>
    </div>
  );
}
