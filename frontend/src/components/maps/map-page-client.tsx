"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { neighborhoods } from "@/data/neighborhoods";
import { properties } from "@/data/properties";
import { DistrictMap } from "./district-map";
import { NeighborhoodScorePanel } from "./neighborhood-score-panel";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-gauge";
import { cn, formatPrice, formatSurface } from "@/lib/utils";

export function MapPageClient() {
  const [neighborhoodId, setNeighborhoodId] = useState(neighborhoods[0].id);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const neighborhood = neighborhoods.find((n) => n.id === neighborhoodId)!;
  const localProperties = useMemo(
    () => properties.filter((p) => p.neighborhoodId === neighborhoodId),
    [neighborhoodId],
  );
  const selected = localProperties.find((p) => p.id === selectedProperty);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
            Carte comparative des offres
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-500">
            Prix, distances et points d&rsquo;intérêt — écoles, transports,
            bruit, trafic — quartier par quartier. Les quartiers mal notés
            sont signalés.
          </p>
        </div>
      </header>

      {/* Sélecteur de quartier */}
      <div
        role="tablist"
        aria-label="Choisir un quartier"
        className="mt-6 flex gap-2 overflow-x-auto pb-1"
      >
        {neighborhoods.map((n) => (
          <button
            key={n.id}
            role="tab"
            aria-selected={n.id === neighborhoodId}
            onClick={() => {
              setNeighborhoodId(n.id);
              setSelectedProperty(null);
            }}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              n.id === neighborhoodId
                ? "border-navy-800 bg-navy-800 text-sand-50"
                : "border-sand-300 bg-white text-navy-600 hover:border-navy-400",
            )}
          >
            {n.name}
            <span
              className={cn(
                "tnum rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                n.score.overall >= 70
                  ? "bg-success-50 text-success-700"
                  : n.score.overall >= 55
                    ? "bg-warning-50 text-warning-700"
                    : "bg-danger-50 text-danger-700",
                n.id === neighborhoodId && "bg-white/15 text-sand-50",
              )}
            >
              {n.score.overall}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <DistrictMap
            neighborhood={neighborhood}
            properties={localProperties}
            selectedId={selectedProperty}
            onSelect={(id) =>
              setSelectedProperty((cur) => (cur === id ? null : id))
            }
          />

          {/* Fiche du bien sélectionné */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="mt-4 flex flex-col gap-4 rounded-card border border-sand-200 bg-white p-4 shadow-card sm:flex-row"
              >
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl sm:w-52">
                  <Image
                    src={selected.images[0]}
                    alt={selected.title}
                    fill
                    sizes="208px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-sm font-semibold text-navy-900">
                      {selected.title}
                    </h2>
                    <ScoreBar value={selected.honestyScore} />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-navy-400">
                    <MapPin className="size-3.5" aria-hidden />
                    {selected.address}, {selected.city}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="tnum font-display text-lg font-semibold text-navy-900">
                      {formatPrice(selected.price)}
                      {selected.transaction === "location" && (
                        <span className="text-xs font-normal text-navy-400"> /mois</span>
                      )}
                    </span>
                    <Badge variant="sand">{formatSurface(selected.surface)}</Badge>
                    <Badge variant="sand">{selected.rooms} pièces</Badge>
                    <Badge variant="outline" className="tnum">
                      DPE {selected.energyClass}
                    </Badge>
                  </div>
                  <Link
                    href={`/biens/${selected.id}`}
                    className="group mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-gold-700 hover:text-gold-800"
                  >
                    Voir le bien
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panneau quartier */}
        <aside className="space-y-4">
          <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
            <NeighborhoodScorePanel neighborhood={neighborhood} />
          </div>
          <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
            <h3 className="text-xs font-semibold tracking-wide text-navy-400 uppercase">
              Points d&rsquo;intérêt à proximité
            </h3>
            <ul className="mt-3 space-y-2.5">
              {neighborhood.pois.map((poi) => (
                <li
                  key={poi.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span
                    className={cn(
                      "flex items-center gap-2",
                      poi.negative ? "text-danger-600" : "text-navy-700",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        poi.negative ? "bg-danger-500" : "bg-success-500",
                      )}
                      aria-hidden
                    />
                    {poi.label}
                  </span>
                  <span className="tnum shrink-0 text-xs text-navy-400">
                    {poi.distanceMin} min
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
            <h3 className="text-xs font-semibold tracking-wide text-navy-400 uppercase">
              {localProperties.length} bien{localProperties.length > 1 ? "s" : ""} dans ce quartier
            </h3>
            <ul className="mt-3 space-y-2">
              {localProperties.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedProperty(p.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      selectedProperty === p.id
                        ? "bg-gold-100 text-navy-900"
                        : "text-navy-600 hover:bg-sand-100",
                    )}
                  >
                    <span className="line-clamp-1">{p.title}</span>
                    <span className="tnum shrink-0 text-xs font-semibold">
                      {formatPrice(p.price)}
                      {p.transaction === "location" && "/m"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
