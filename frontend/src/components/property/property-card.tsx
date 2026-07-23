"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BedDouble, Globe, Heart, MapPin, Ruler, Scale3d } from "lucide-react";
import type { Property } from "@/types";
import { Badge, StatusChip } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-gauge";
import { useCompareList, useFavorites } from "@/hooks/use-local-list";
import { cn, formatPrice, formatSurface } from "@/lib/utils";

const statusLabel: Record<Property["status"], { label: string; tone: "success" | "warning" | "danger" | "neutral" | "gold" }> = {
  disponible: { label: "Disponible", tone: "success" },
  sous_offre: { label: "Sous offre", tone: "warning" },
  loue: { label: "Loué", tone: "neutral" },
  vendu: { label: "Vendu", tone: "neutral" },
  brouillon: { label: "Brouillon", tone: "neutral" },
  en_verification: { label: "En vérification", tone: "gold" },
};

export function PropertyCard({
  property,
  showScore = true,
}: {
  property: Property;
  showScore?: boolean;
}) {
  const favorites = useFavorites();
  const compare = useCompareList();
  const isFav = favorites.has(property.id);
  const inCompare = compare.has(property.id);
  const status = statusLabel[property.status];

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-sand-200 bg-white shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-200">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <StatusChip tone={status.tone} className="bg-white/95 shadow-sm">
              {status.label}
            </StatusChip>
            {property.source === "web" && (
              <Badge variant="navy" className="shadow-sm">
                <Globe className="size-3" aria-hidden />
                {property.sourceName}
              </Badge>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={(e) => {
                e.preventDefault();
                compare.toggle(property.id);
              }}
              aria-label={
                inCompare ? "Retirer du comparateur" : "Ajouter au comparateur"
              }
              aria-pressed={inCompare}
              className={cn(
                "flex size-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition-colors",
                inCompare
                  ? "bg-navy-800 text-gold-400"
                  : "bg-white/95 text-navy-500 hover:text-navy-800",
              )}
            >
              <Scale3d className="size-4" aria-hidden />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                favorites.toggle(property.id);
              }}
              aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={isFav}
              className={cn(
                "flex size-8 items-center justify-center rounded-full shadow-sm backdrop-blur transition-colors",
                isFav
                  ? "bg-danger-500 text-white"
                  : "bg-white/95 text-navy-500 hover:text-danger-500",
              )}
            >
              <Heart className={cn("size-4", isFav && "fill-current")} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="tnum font-display text-lg font-semibold text-navy-900">
            {formatPrice(property.price)}
            {property.transaction === "location" && (
              <span className="text-sm font-normal text-navy-400"> /mois</span>
            )}
          </p>
          {showScore && <ScoreBar value={property.honestyScore} />}
        </div>
        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold text-navy-800">
          <Link
            href={`/biens/${property.id}`}
            className="after:absolute after:inset-0"
          >
            {property.title}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-navy-400">
          <MapPin className="size-3.5" aria-hidden />
          {property.address}, {property.city}
        </p>
        <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-navy-500">
          <span className="flex items-center gap-1.5">
            <Ruler className="size-3.5" aria-hidden />
            {formatSurface(property.surface)}
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="size-3.5" aria-hidden />
            {property.bedrooms} ch.
          </span>
          <span>{property.rooms} pièces</span>
          <Badge variant="outline" className="tnum ml-auto">
            DPE {property.energyClass}
          </Badge>
        </div>
      </div>
    </motion.article>
  );
}
