"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Property } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatSurface } from "@/lib/utils";

export function InvestorPropertyList({ properties }: { properties: Property[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.slice(0, 6).map((p) => (
        <div
          key={p.id}
          className="flex flex-col overflow-hidden rounded-card border border-sand-200 bg-white shadow-card"
        >
          <div className="relative aspect-[16/10]">
            <Image
              src={p.images[0]}
              alt={p.title}
              fill
              sizes="(max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col p-4">
            <p className="line-clamp-1 text-sm font-semibold text-navy-900">
              {p.title}
            </p>
            <p className="mt-1 text-xs text-navy-400">
              {p.city} · {formatSurface(p.surface)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="tnum text-sm font-semibold text-navy-900">
                {formatPrice(p.price)}
                {p.transaction === "location" && (
                  <span className="text-xs font-normal text-navy-400">/mois</span>
                )}
              </span>
              <Badge variant="outline" className="tnum">
                DPE {p.energyClass}
              </Badge>
            </div>
            <Link
              href={`/espace/investisseur/rapport/${p.id}`}
              className="group mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-gold-700 hover:text-gold-800"
            >
              Générer le rapport
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
