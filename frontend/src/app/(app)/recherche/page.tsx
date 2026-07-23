import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "@/components/search/search-page-client";
import { PropertyCardSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Recherche de biens",
  description:
    "Recherche hybride en langage naturel : décrivez votre besoin, l'IA agrège et classe les offres de la plateforme et du web.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
