"use client";

import { useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import type { VisitQuestion } from "@/types";
import { suggestVisitQuestions } from "@/services/ai-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** EF-L-07 — AI visit assistant: suggested questions for the owner. */
export function VisitQuestions({ propertyType }: { propertyType: string }) {
  const [questions, setQuestions] = useState<VisitQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const load = async () => {
    setLoading(true);
    setQuestions(await suggestVisitQuestions(propertyType));
    setLoading(false);
  };

  return (
    <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
            <ClipboardList className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-navy-900">
              Assistant de visite
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">
              Questions pertinentes à poser au propriétaire, adaptées à ce
              type de bien. Cochez-les pendant la visite.
            </p>
          </div>
        </div>
        {!questions && (
          <Button size="sm" variant="outline" onClick={load} loading={loading}>
            {loading ? "Préparation…" : "Préparer mes questions"}
          </Button>
        )}
      </div>

      {loading && !questions && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-sand-100 p-4 text-sm text-navy-600">
          <Loader2 className="size-4 animate-spin text-gold-600" aria-hidden />
          Analyse du bien et des points de vigilance types…
        </div>
      )}

      {questions && (
        <ul className="mt-4 space-y-2.5">
          {questions.map((q, i) => (
            <li key={q.question}>
              <label className="flex cursor-pointer gap-3 rounded-lg border border-sand-200 p-3.5 transition-colors has-checked:border-gold-500/50 has-checked:bg-gold-50">
                <input
                  type="checkbox"
                  checked={checked.has(i)}
                  onChange={() =>
                    setChecked((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                  className="mt-0.5 size-4 shrink-0 accent-gold-600"
                />
                <span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge variant="sand" className="text-[10px]">
                      {q.category}
                    </Badge>
                  </span>
                  <span className="mt-1.5 block text-sm font-medium text-navy-800">
                    {q.question}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-navy-400">
                    {q.why}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
