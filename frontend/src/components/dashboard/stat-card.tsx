import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: number;
  tone?: "neutral" | "gold";
}) {
  return (
    <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            tone === "gold" ? "bg-gold-100 text-gold-700" : "bg-navy-800 text-gold-400",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        {typeof change === "number" && (
          <span
            className={cn(
              "tnum flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              change >= 0
                ? "bg-success-50 text-success-700"
                : "bg-danger-50 text-danger-700",
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="size-3" aria-hidden />
            ) : (
              <TrendingDown className="size-3" aria-hidden />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="tnum mt-4 font-display text-2xl font-semibold text-navy-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-navy-500">{label}</p>
    </div>
  );
}
