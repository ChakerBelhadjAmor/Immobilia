"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Page précédente"
        className="flex size-9 items-center justify-center rounded-lg text-navy-500 transition hover:bg-sand-100 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-navy-300">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg text-sm font-medium transition",
              p === page
                ? "bg-navy-800 text-sand-50"
                : "text-navy-600 hover:bg-sand-100",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Page suivante"
        className="flex size-9 items-center justify-center rounded-lg text-navy-500 transition hover:bg-sand-100 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
