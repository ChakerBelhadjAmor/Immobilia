"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Globe, Landmark, Loader2 } from "lucide-react";
import type { CompetitorListing } from "@/types";
import type { ListingDraft } from "./wizard-types";
import { properties } from "@/data/properties";
import { fetchCompetitors } from "@/services/property-service";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

/** EF-V-04 — automatic competitive analysis against similar listings. */
export function StepCompetition({ draft }: { draft: ListingDraft }) {
  const [competitors, setCompetitors] = useState<CompetitorListing[] | null>(null);

  useEffect(() => {
    const seed =
      properties.find(
        (p) => p.city.toLowerCase().includes(draft.city.toLowerCase()) && draft.city,
      ) ?? properties.find((p) => p.type === draft.type) ?? properties[0];
    fetchCompetitors(seed.id).then(setCompetitors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avgPricePerSqm = competitors
    ? Math.round(
        competitors.reduce((a, c) => a + c.pricePerSqm, 0) / competitors.length,
      )
    : null;

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-sand-200 bg-navy-950 p-5 text-sand-100">
        <p className="text-xs tracking-wide text-gold-400 uppercase">
          Positionnement automatique
        </p>
        <p className="mt-2 text-sm leading-relaxed text-sand-300/85">
          Votre bien est comparé aux annonces actives du même quartier et du
          même type sur la plateforme et le web, pour situer votre offre face
          à la concurrence réelle.
        </p>
        {avgPricePerSqm && (
          <p className="tnum mt-4 font-display text-2xl font-semibold text-sand-50">
            {avgPricePerSqm.toLocaleString("fr-FR")} €/m²{" "}
            <span className="text-sm font-normal text-sand-300/70">
              moyenne du secteur
            </span>
          </p>
        )}
      </div>

      {!competitors ? (
        <div className="flex items-center gap-3 rounded-lg bg-sand-100 p-4 text-sm text-navy-600">
          <Loader2 className="size-4 animate-spin text-gold-600" aria-hidden />
          Recherche des annonces comparables…
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {competitors.map((c) => (
            <li
              key={c.id}
              className="flex gap-3 rounded-xl border border-sand-200 bg-white p-3"
            >
              <Image
                src={c.imageUrl}
                alt=""
                width={72}
                height={72}
                className="size-18 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-navy-800">
                  {c.title}
                </p>
                <p className="tnum mt-1 text-sm font-semibold text-navy-900">
                  {formatPrice(c.price)}
                </p>
                <p className="tnum text-xs text-navy-400">
                  {c.pricePerSqm.toLocaleString("fr-FR")} €/m² · {c.distanceKm} km
                </p>
                <Badge variant={c.source === "plateforme" ? "gold" : "navy"} className="mt-1.5 text-[10px]">
                  {c.source === "plateforme" ? (
                    <Landmark className="size-2.5" aria-hidden />
                  ) : (
                    <Globe className="size-2.5" aria-hidden />
                  )}
                  {c.source === "plateforme" ? "Plateforme" : "Web"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
