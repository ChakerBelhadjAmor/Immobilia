"use client";

import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { properties } from "@/data/properties";
import { useFavorites } from "@/hooks/use-local-list";
import { PropertyCard } from "./property-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export function FavoritesPageClient() {
  const favorites = useFavorites();
  const items = properties.filter((p) => favorites.has(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Mes favoris
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          {items.length} bien{items.length > 1 ? "s" : ""} enregistré
          {items.length > 1 ? "s" : ""}.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<Heart className="size-6" aria-hidden />}
            title="Aucun favori pour le moment"
            description="Explorez les annonces et cliquez sur le cœur pour les enregistrer ici."
            action={
              <Link href="/recherche">
                <Button tabIndex={-1}>
                  <Search className="size-4" aria-hidden />
                  Explorer les biens
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
