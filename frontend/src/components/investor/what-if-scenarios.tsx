"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { WhatIfScenario } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

/** EF-I-02 — toggleable what-if scenarios with cumulative impact. */
export function WhatIfScenarios({
  scenarios,
  baseYield,
  baseValue,
}: {
  scenarios: WhatIfScenario[];
  baseYield: number;
  baseValue: number;
}) {
  const [active, setActive] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const totals = useMemo(() => {
    const selected = scenarios.filter((s) => active.has(s.id));
    return {
      deltaYield: selected.reduce((a, s) => a + s.deltaYield, 0),
      deltaValue: selected.reduce((a, s) => a + s.deltaValue, 0),
    };
  }, [scenarios, active]);

  return (
    <div>
      <ul className="space-y-3">
        {scenarios.map((s) => {
          const on = active.has(s.id);
          return (
            <li key={s.id}>
              <button
                onClick={() => toggle(s.id)}
                aria-pressed={on}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  on
                    ? "border-gold-500/60 bg-gold-50"
                    : "border-sand-200 bg-white hover:border-navy-300",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                    on ? "bg-gold-500 text-navy-950" : "bg-sand-200 text-navy-400",
                  )}
                >
                  {on ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-navy-900">
                    {s.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-navy-500">
                    {s.description}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span
                    className={cn(
                      "tnum block text-sm font-bold",
                      s.deltaYield >= 0 ? "text-success-600" : "text-danger-600",
                    )}
                  >
                    {s.deltaYield >= 0 ? "+" : ""}
                    {s.deltaYield} pt
                  </span>
                  <span
                    className={cn(
                      "tnum block text-xs",
                      s.deltaValue >= 0 ? "text-success-600" : "text-danger-600",
                    )}
                  >
                    {s.deltaValue >= 0 ? "+" : ""}
                    {formatPrice(s.deltaValue)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 rounded-xl bg-navy-950 p-5 text-sand-100">
        <p className="text-xs tracking-wide text-gold-400 uppercase">
          Simulation combinée ({active.size} scénario{active.size > 1 ? "s" : ""})
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <div>
            <span className="tnum font-display text-2xl font-semibold text-sand-50">
              {(baseYield + totals.deltaYield).toFixed(1)}%
            </span>
            <span className="ml-2 text-xs text-sand-300/60">
              rendement net ajusté (base {baseYield}%)
            </span>
          </div>
          <div>
            <span className="tnum font-display text-2xl font-semibold text-sand-50">
              {formatPrice(baseValue + totals.deltaValue)}
            </span>
            <span className="ml-2 text-xs text-sand-300/60">
              valeur ajustée du bien
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
