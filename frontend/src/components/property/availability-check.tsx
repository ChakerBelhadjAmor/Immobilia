"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ImageOff, Loader2, ShieldQuestion } from "lucide-react";
import { verifyAvailability } from "@/services/property-service";
import { Button } from "@/components/ui/button";

type CheckState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      available: boolean;
      method: string;
      matches: { source: string; status: string; date: string }[];
    };

/** EF-L-10 — verify the listing is not already rented, via image search. */
export function AvailabilityCheck({ propertyId }: { propertyId: string }) {
  const [state, setState] = useState<CheckState>({ status: "idle" });

  const run = async () => {
    setState({ status: "loading" });
    const result = await verifyAvailability(propertyId);
    setState({ status: "done", ...result });
  };

  return (
    <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
            <ShieldQuestion className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-navy-900">
              Vérification anti-arnaque
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">
              L&rsquo;IA compare les photos de l&rsquo;annonce à 14 portails
              par recherche d&rsquo;image inversée pour vérifier que le bien
              n&rsquo;est pas déjà loué ou vendu ailleurs.
            </p>
          </div>
        </div>
        {state.status === "idle" && (
          <Button size="sm" variant="outline" onClick={run}>
            Vérifier
          </Button>
        )}
      </div>

      {state.status === "loading" && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-sand-100 p-4 text-sm text-navy-600">
          <Loader2 className="size-4 animate-spin text-gold-600" aria-hidden />
          Analyse des images sur les portails partenaires…
        </div>
      )}

      {state.status === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <div
            role="status"
            className={`flex items-center gap-2.5 rounded-lg p-3.5 text-sm font-medium ${
              state.available
                ? "bg-success-50 text-success-700"
                : "bg-danger-50 text-danger-700"
            }`}
          >
            {state.available ? (
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
            ) : (
              <ImageOff className="size-5 shrink-0" aria-hidden />
            )}
            {state.available
              ? "Bien disponible : aucune trace de location ou vente parallèle."
              : "Vigilance : ce bien apparaît comme déjà loué sur d'autres portails."}
          </div>
          <p className="mt-2 text-xs text-navy-400">{state.method}</p>
          <ul className="mt-3 divide-y divide-sand-100 rounded-lg border border-sand-200">
            {state.matches.map((m) => (
              <li
                key={m.source}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
              >
                <span className="font-semibold text-navy-800">{m.source}</span>
                <span className="flex-1 text-navy-500">{m.status}</span>
                <span className="tnum shrink-0 text-navy-400">{m.date}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
