"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellPlus,
  Globe,
  History,
  Landmark,
  SearchX,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { Property } from "@/types";
import {
  searchProperties,
  type SearchFilters,
} from "@/services/property-service";
import { searchHistory } from "@/data/community";
import { PropertyCard } from "@/components/property/property-card";
import { SearchBar } from "./search-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PropertyCardSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

export function SearchPageClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const query = params.get("q") ?? "";

  const [results, setResults] = useState<Property[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    transaction: "tous",
    type: "tous",
  });

  const runSearch = useCallback(
    async (q: string, f: SearchFilters) => {
      setLoading(true);
      setPage(1);
      const found = await searchProperties({ ...f, query: q || undefined });
      setResults(found);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    runSearch(query, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const applyFilters = (next: Partial<SearchFilters>) => {
    const merged = { ...filters, ...next };
    setFilters(merged);
    runSearch(query, merged);
  };

  const totalPages = Math.ceil((results?.length ?? 0) / PAGE_SIZE);
  const pageItems = useMemo(
    () => (results ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [results, page],
  );
  const platformCount = results?.filter((r) => r.source === "plateforme").length ?? 0;
  const webCount = results?.filter((r) => r.source === "web").length ?? 0;

  const createAlert = () => {
    toast({
      variant: "success",
      title: "Alerte créée",
      description:
        "Vous serez notifiée dès qu'une offre similaire à cette recherche sera publiée.",
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Trouvez le bien qui vous ressemble
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          Décrivez votre besoin en langage naturel — budget, critères, mode de
          vie. La recherche hybride combine compréhension sémantique et
          filtres exacts, sur la plateforme et le web.
        </p>
      </header>

      <div className="mt-6">
        <SearchBar
          initialQuery={query}
          onSearch={(q) => router.push(`/recherche?q=${encodeURIComponent(q)}`)}
        />
      </div>

      {/* Historique de recherche */}
      {!query && (
        <section aria-label="Recherches récentes" className="mt-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-navy-400 uppercase">
            <History className="size-3.5" aria-hidden />
            Vos recherches récentes
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  router.push(`/recherche?q=${encodeURIComponent(item.query)}`)
                }
                className="group flex items-center gap-2 rounded-full border border-sand-300 bg-white px-3.5 py-1.5 text-xs text-navy-600 transition-colors hover:border-gold-500 hover:text-navy-900"
              >
                <span className="max-w-64 truncate sm:max-w-none">{item.query}</span>
                {item.alertEnabled && (
                  <Badge variant="gold" className="px-1.5 py-0">
                    alerte active
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Barre de contrôle résultats */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-navy-600">
          {loading ? (
            <span>Analyse de votre demande…</span>
          ) : (
            <>
              <span className="font-semibold text-navy-900">
                {results?.length ?? 0} biens
              </span>
              <span className="text-navy-300">·</span>
              <Badge variant="gold">
                <Landmark className="size-3" aria-hidden />
                {platformCount} plateforme
              </Badge>
              <Badge variant="navy">
                <Globe className="size-3" aria-hidden />
                {webCount} agrégés du web
              </Badge>
              <span className="hidden items-center gap-1 text-xs text-navy-400 sm:flex">
                <Sparkles className="size-3.5 text-gold-600" aria-hidden />
                classés par score d&rsquo;honnêteté
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtres
          </Button>
          <Button variant="secondary" size="sm" onClick={createAlert}>
            <BellPlus className="size-4" aria-hidden />
            Créer une alerte
          </Button>
        </div>
      </div>

      {/* Filtres structurés */}
      <div
        className={cn(
          "grid gap-4 overflow-hidden transition-all duration-300 sm:grid-cols-2 lg:grid-cols-5",
          showFilters ? "mt-5 max-h-96" : "max-h-0",
        )}
      >
        <Select
          label="Transaction"
          value={filters.transaction}
          onChange={(e) =>
            applyFilters({ transaction: e.target.value as SearchFilters["transaction"] })
          }
        >
          <option value="tous">Achat & location</option>
          <option value="vente">Achat</option>
          <option value="location">Location</option>
        </Select>
        <Select
          label="Type de bien"
          value={filters.type}
          onChange={(e) => applyFilters({ type: e.target.value as SearchFilters["type"] })}
        >
          <option value="tous">Tous les types</option>
          <option value="appartement">Appartement</option>
          <option value="maison">Maison</option>
          <option value="studio">Studio</option>
          <option value="loft">Loft</option>
          <option value="duplex">Duplex</option>
          <option value="immeuble">Immeuble</option>
        </Select>
        <Input
          label="Ville"
          placeholder="Paris, Lyon…"
          defaultValue={filters.city ?? ""}
          onBlur={(e) => applyFilters({ city: e.target.value || undefined })}
        />
        <Input
          label="Budget max (€)"
          type="number"
          placeholder="500 000"
          onBlur={(e) =>
            applyFilters({ priceMax: e.target.value ? Number(e.target.value) : undefined })
          }
        />
        <Input
          label="Surface min (m²)"
          type="number"
          placeholder="40"
          onBlur={(e) =>
            applyFilters({ surfaceMin: e.target.value ? Number(e.target.value) : undefined })
          }
        />
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title="Aucun bien ne correspond à cette recherche"
            description="Élargissez vos critères, ou créez une alerte : nous vous notifierons dès qu'une offre similaire sera publiée."
            action={
              <Button onClick={createAlert}>
                <BellPlus className="size-4" aria-hidden />
                Me notifier des offres similaires
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          <div className="mt-10">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
