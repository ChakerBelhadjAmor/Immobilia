"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import type { Neighborhood, Property } from "@/types";
import { formatPriceCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

const poiStyles: Record<
  string,
  { symbol: string; label: string }
> = {
  ecole: { symbol: "É", label: "École" },
  universite: { symbol: "U", label: "Université" },
  transport: { symbol: "M", label: "Transport" },
  commerce: { symbol: "C", label: "Commerces" },
  parc: { symbol: "P", label: "Parc" },
  hopital: { symbol: "H", label: "Hôpital" },
  bruit: { symbol: "♪", label: "Bruit" },
  pollution: { symbol: "▲", label: "Pollution" },
  embouteillage: { symbol: "⛔", label: "Trafic" },
};

/**
 * Stylised district map — EF-L-03.
 * Deliberately schematic (not a GIS tile): price pins, POIs and
 * distances on an abstract street grid, in brand style.
 */
export function DistrictMap({
  neighborhood,
  properties,
  selectedId,
  onSelect,
}: {
  neighborhood: Neighborhood;
  properties: Property[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const gridId = useId();
  const [hoveredPoi, setHoveredPoi] = useState<string | null>(null);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card border border-sand-300 bg-[#F2EDE2] sm:aspect-[16/10]">
      <svg
        viewBox="0 0 100 75"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Carte schématique du quartier ${neighborhood.name}`}
      >
        <defs>
          <pattern
            id={gridId}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="#DCCFB4"
              strokeWidth="0.25"
            />
          </pattern>
        </defs>
        <rect width="100" height="75" fill={`url(#${gridId})`} />
        {/* Axes principaux stylisés */}
        <path d="M 0 52 Q 30 46 55 50 T 100 44" fill="none" stroke="#D9C8AB" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M 38 0 Q 42 25 36 45 T 42 75" fill="none" stroke="#D9C8AB" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 62 0 Q 66 30 74 48 T 78 75" fill="none" stroke="#E3D6BE" strokeWidth="1.2" strokeLinecap="round" />
        {/* Parc stylisé */}
        <ellipse cx="18" cy="20" rx="12" ry="8" fill="#DCE5D4" opacity="0.9" />
        <ellipse cx="85" cy="62" rx="10" ry="7" fill="#DCE5D4" opacity="0.7" />
      </svg>

      {/* Points d'intérêt */}
      {neighborhood.pois.map((poi) => {
        const style = poiStyles[poi.kind];
        const isHovered = hoveredPoi === poi.id;
        return (
          <button
            key={poi.id}
            style={{ left: `${poi.position.x}%`, top: `${poi.position.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            onMouseEnter={() => setHoveredPoi(poi.id)}
            onMouseLeave={() => setHoveredPoi(null)}
            onFocus={() => setHoveredPoi(poi.id)}
            onBlur={() => setHoveredPoi(null)}
            aria-label={`${style.label} : ${poi.label}, à ${poi.distanceMin} min à pied`}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm transition-transform",
                poi.negative
                  ? "border-danger-500/40 bg-danger-50 text-danger-600"
                  : "border-navy-300 bg-white text-navy-700",
                isHovered && "scale-125",
              )}
            >
              {style.symbol}
            </span>
            {isHovered && (
              <span className="absolute bottom-full left-1/2 z-20 mb-1.5 w-max max-w-44 -translate-x-1/2 rounded-lg bg-navy-950 px-2.5 py-1.5 text-left text-[11px] leading-snug text-sand-100 shadow-modal">
                <strong className="block">{poi.label}</strong>
                {poi.distanceMin} min à pied
                {poi.negative && " · point de vigilance"}
              </span>
            )}
          </button>
        );
      })}

      {/* Épingles prix des biens */}
      {properties.map((p) => {
        const selected = selectedId === p.id;
        return (
          <motion.button
            key={p.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "backOut" }}
            style={{ left: `${p.position.x}%`, top: `${p.position.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full"
            onClick={() => onSelect(p.id)}
            aria-label={`${p.title} — ${formatPriceCompact(p.price)}`}
            aria-pressed={selected}
          >
            <span
              className={cn(
                "tnum relative block rounded-full px-3 py-1.5 text-xs font-bold shadow-md transition-all",
                selected
                  ? "z-10 scale-110 bg-gold-500 text-navy-950 ring-2 ring-navy-800"
                  : "bg-navy-800 text-sand-50 hover:bg-navy-700",
              )}
            >
              {formatPriceCompact(p.price)}
              {p.transaction === "location" && "/m"}
              <span
                className={cn(
                  "absolute top-full left-1/2 -mt-px size-2 -translate-x-1/2 rotate-45",
                  selected ? "bg-gold-500" : "bg-navy-800",
                )}
                aria-hidden
              />
            </span>
          </motion.button>
        );
      })}

      {/* Légende */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-white/90 px-3 py-2 text-[10px] text-navy-600 shadow-sm backdrop-blur">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-navy-800" /> Bien à vendre / louer
        </span>
        <span className="flex items-center gap-1">
          <span className="flex size-3.5 items-center justify-center rounded-full border border-navy-300 bg-white text-[7px] font-bold">M</span>
          Point d&rsquo;intérêt
        </span>
        <span className="flex items-center gap-1">
          <span className="flex size-3.5 items-center justify-center rounded-full border border-danger-500/40 bg-danger-50 text-[7px] font-bold text-danger-600">♪</span>
          Vigilance (bruit, trafic…)
        </span>
      </div>
    </div>
  );
}
