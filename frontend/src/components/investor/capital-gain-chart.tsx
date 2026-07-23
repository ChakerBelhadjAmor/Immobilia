import type { CapitalGainForecast } from "@/types";
import { formatPriceCompact } from "@/lib/utils";

/** EF-I-05 — 5/10 year capital gain forecast, simple bar comparison. */
export function CapitalGainChart({ forecast }: { forecast: CapitalGainForecast }) {
  const max = forecast.in10Years;
  const bars = [
    { label: "Aujourd'hui", value: forecast.now },
    { label: "Dans 5 ans", value: forecast.in5Years },
    { label: "Dans 10 ans", value: forecast.in10Years },
  ];

  return (
    <div>
      <div className="flex items-end gap-4 sm:gap-8">
        {bars.map((bar, i) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="tnum text-sm font-semibold text-navy-900">
              {formatPriceCompact(bar.value)}
            </span>
            <div className="flex h-40 w-full items-end overflow-hidden rounded-t-lg bg-sand-100">
              <div
                className={
                  i === bars.length - 1
                    ? "w-full rounded-t-lg bg-gold-500"
                    : "w-full rounded-t-lg bg-navy-700"
                }
                style={{ height: `${Math.max((bar.value / max) * 100, 6)}%` }}
              />
            </div>
            <span className="text-xs text-navy-400">{bar.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm leading-relaxed text-navy-600">
        {forecast.neighborhoodTrend}
      </p>
    </div>
  );
}
