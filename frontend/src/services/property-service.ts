/* ------------------------------------------------------------------
   Property service — mock implementation.
   Each function mirrors a future REST endpoint (commented) so the
   swap to a real API is a drop-in replacement.
------------------------------------------------------------------ */

import { properties, getPropertyById } from "@/data/properties";
import { getNeighborhoodById } from "@/data/neighborhoods";
import { reviews } from "@/data/community";
import { delay } from "@/lib/utils";
import type {
  CompetitorListing,
  Property,
  PropertyType,
  TransactionType,
} from "@/types";

export interface SearchFilters {
  query?: string;
  transaction?: TransactionType | "tous";
  type?: PropertyType | "tous";
  city?: string;
  priceMax?: number;
  roomsMin?: number;
  surfaceMin?: number;
}

/** GET /api/properties */
export async function searchProperties(
  filters: SearchFilters = {},
): Promise<Property[]> {
  await delay(600);
  let results = [...properties].filter((p) => p.status !== "brouillon");

  if (filters.transaction && filters.transaction !== "tous") {
    results = results.filter((p) => p.transaction === filters.transaction);
  }
  if (filters.type && filters.type !== "tous") {
    results = results.filter((p) => p.type === filters.type);
  }
  if (filters.city) {
    const c = filters.city.toLowerCase();
    results = results.filter((p) => p.city.toLowerCase().includes(c));
  }
  if (filters.priceMax) {
    results = results.filter((p) => p.price <= filters.priceMax!);
  }
  if (filters.roomsMin) {
    results = results.filter((p) => p.rooms >= filters.roomsMin!);
  }
  if (filters.surfaceMin) {
    results = results.filter((p) => p.surface >= filters.surfaceMin!);
  }
  if (filters.query) {
    const terms = filters.query.toLowerCase();
    // Recherche hybride simulée : lexical + notions extraites du langage naturel.
    results = results.filter((p) => {
      const haystack =
        `${p.title} ${p.description} ${p.city} ${p.features.join(" ")} ${p.type}`.toLowerCase();
      return terms
        .split(/[\s,]+/)
        .filter((t) => t.length > 3)
        .some((t) => haystack.includes(t));
    });
    if (results.length === 0) {
      results = [...properties].filter((p) => p.status === "disponible");
    }
  }

  // EF-L-04 : classement par score d'honnêteté décroissant (les plus fiables d'abord).
  return results.sort((a, b) => b.honestyScore - a.honestyScore);
}

/** GET /api/properties/:id */
export async function fetchProperty(id: string): Promise<Property | null> {
  await delay(350);
  return getPropertyById(id) ?? null;
}

/** GET /api/properties/:id/similar — EF-V-04 / EF-L-14 */
export async function fetchSimilarProperties(id: string): Promise<Property[]> {
  await delay(450);
  const ref = getPropertyById(id);
  if (!ref) return [];
  return properties
    .filter(
      (p) =>
        p.id !== id &&
        (p.neighborhoodId === ref.neighborhoodId || p.type === ref.type) &&
        p.transaction === ref.transaction,
    )
    .slice(0, 4);
}

/** GET /api/properties/:id/competitors — EF-V-04 */
export async function fetchCompetitors(
  id: string,
): Promise<CompetitorListing[]> {
  await delay(700);
  const ref = getPropertyById(id);
  const base = ref?.price ?? 400000;
  const surface = ref?.surface ?? 80;
  const seeds = [
    { d: -0.06, s: -6, km: 0.4, src: "plateforme" as const, img: "photo-1560448204-e02f11c3d0e2", days: 12 },
    { d: 0.04, s: 3, km: 0.7, src: "web" as const, img: "photo-1522708323590-d24dbb6b0267", days: 5 },
    { d: -0.02, s: -2, km: 0.9, src: "web" as const, img: "photo-1502672260266-1c1ef2d93688", days: 21 },
    { d: 0.09, s: 8, km: 1.2, src: "plateforme" as const, img: "photo-1598928506311-c55ded91a20c", days: 33 },
    { d: -0.11, s: -12, km: 1.4, src: "web" as const, img: "photo-1560185007-cde436f6a4d0", days: 2 },
  ];
  return seeds.map((seed, i) => {
    const s = Math.max(18, Math.round(surface + seed.s));
    const price = Math.round((base * (1 + seed.d)) / 1000) * 1000;
    return {
      id: `comp-${id}-${i}`,
      title: `${ref?.type === "maison" ? "Maison" : "Appartement"} ${s} m² — même secteur`,
      price,
      surface: s,
      pricePerSqm: Math.round(price / s),
      distanceKm: seed.km,
      imageUrl: `https://images.unsplash.com/${seed.img}?auto=format&fit=crop&w=600&q=70`,
      source: seed.src,
      publishedAt: new Date(Date.now() - seed.days * 86400000).toISOString(),
    };
  });
}

/** GET /api/properties/:id/reviews — EF-L-11 */
export async function fetchReviews(propertyId: string) {
  await delay(300);
  return reviews.filter((r) => r.propertyId === propertyId);
}

/** GET /api/neighborhoods/:id — EF-L-03 / EF-L-05 */
export async function fetchNeighborhood(id: string) {
  await delay(300);
  return getNeighborhoodById(id) ?? null;
}

/** POST /api/properties/:id/verify-availability — EF-L-10 */
export async function verifyAvailability(id: string): Promise<{
  available: boolean;
  method: string;
  matches: { source: string; status: string; date: string }[];
}> {
  await delay(1400);
  const p = getPropertyById(id);
  const available = p?.availabilityVerified ?? false;
  return {
    available,
    method: "Recherche par image inversée sur 14 portails",
    matches: available
      ? [
          { source: "SeLoger", status: "Annonce active identique", date: "2026-07-14" },
          { source: "LeBonCoin", status: "Aucune correspondance", date: "2026-07-16" },
        ]
      : [
          { source: "LeBonCoin", status: "Annonce marquée « louée » détectée", date: "2026-07-06" },
          { source: "PAP", status: "Photos identiques, prix différent (−15 %)", date: "2026-06-30" },
        ],
  };
}
