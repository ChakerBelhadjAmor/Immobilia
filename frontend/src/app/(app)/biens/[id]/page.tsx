import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  BedDouble,
  Building2,
  CalendarDays,
  Eye,
  Heart,
  MapPin,
  Ruler,
} from "lucide-react";
import { getPropertyById, properties } from "@/data/properties";
import { getNeighborhoodById } from "@/data/neighborhoods";
import { getUserById } from "@/data/users";
import { formatDate, formatPrice, formatSurface } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { Gallery } from "@/components/property/gallery";
import { PriceAnalysisCard } from "@/components/property/price-analysis-card";
import { AvailabilityCheck } from "@/components/property/availability-check";
import { VisitQuestions } from "@/components/property/visit-questions";
import { FloorPlanDialog } from "@/components/property/floor-plan-dialog";
import { ReportDialog } from "@/components/property/report-dialog";
import { ReviewsSection } from "@/components/property/reviews-section";
import { ContractDialog } from "@/components/property/contract-dialog";
import { SimilarProperties } from "@/components/property/similar-properties";
import { ContactOwnerCard } from "@/components/property/contact-owner-card";
import { NeighborhoodScorePanel } from "@/components/maps/neighborhood-score-panel";

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = getPropertyById(id);
  return { title: property?.title ?? "Bien introuvable" };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getPropertyById(id);
  if (!property) notFound();

  const neighborhood = getNeighborhoodById(property.neighborhoodId);
  const owner = getUserById(property.ownerId);

  const keyFacts = [
    { icon: Ruler, label: "Surface", value: formatSurface(property.surface) },
    { icon: Building2, label: "Pièces", value: `${property.rooms}` },
    { icon: BedDouble, label: "Chambres", value: `${property.bedrooms}` },
    {
      icon: CalendarDays,
      label: "Construction",
      value: `${property.yearBuilt}`,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Recherche", href: "/recherche" },
          { label: property.city, href: `/recherche?q=${property.city}` },
          { label: property.title },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Colonne principale */}
        <div>
          <Gallery property={property} />

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold" className="capitalize">
                  {property.transaction === "vente" ? "À vendre" : "À louer"}
                </Badge>
                <Badge variant="sand" className="capitalize">
                  {property.type}
                </Badge>
                {property.source === "web" && (
                  <Badge variant="navy">Agrégé de {property.sourceName}</Badge>
                )}
                {property.availabilityVerified && (
                  <Badge variant="success">
                    <BadgeCheck className="size-3" aria-hidden />
                    Disponibilité vérifiée
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
                {property.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-navy-500">
                <MapPin className="size-4" aria-hidden />
                {property.address}, {property.postalCode} {property.city}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-navy-400">
              <span className="flex items-center gap-1">
                <Eye className="size-3.5" aria-hidden />
                {property.viewCount.toLocaleString("fr-FR")} vues
              </span>
              <span className="flex items-center gap-1">
                <Heart className="size-3.5" aria-hidden />
                {property.favoriteCount}
              </span>
            </div>
          </div>

          {/* Faits clés */}
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {keyFacts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-xl border border-sand-200 bg-white p-4 text-center shadow-card"
              >
                <fact.icon
                  className="mx-auto size-5 text-gold-600"
                  aria-hidden
                />
                <dd className="tnum mt-2 font-display text-lg font-semibold text-navy-900">
                  {fact.value}
                </dd>
                <dt className="text-xs text-navy-400">{fact.label}</dt>
              </div>
            ))}
          </dl>

          {/* Description */}
          <section aria-labelledby="desc-title" className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="desc-title"
                className="font-display text-xl font-semibold text-navy-900"
              >
                Description
              </h2>
              <div className="flex flex-wrap gap-2">
                <FloorPlanDialog propertyId={property.id} />
                <ContractDialog
                  transaction={property.transaction}
                  city={property.city}
                  verify
                />
              </div>
            </div>
            <p className="mt-4 leading-relaxed text-navy-600">
              {property.description}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {property.features.map((f) => (
                <li key={f}>
                  <Badge variant="outline">{f}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-navy-400">
              Publié le {formatDate(property.publishedAt)} ·{" "}
              <ReportDialog propertyTitle={property.title} />
            </p>
          </section>

          {/* Outils IA acheteur */}
          <div className="mt-8 space-y-5">
            <AvailabilityCheck propertyId={property.id} />
            <VisitQuestions propertyType={property.type} />
            <ReviewsSection propertyId={property.id} />
          </div>
        </div>

        {/* Colonne latérale */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
            <p className="text-xs font-medium tracking-wide text-navy-400 uppercase">
              {property.transaction === "vente" ? "Prix de vente" : "Loyer mensuel"}
            </p>
            <p className="tnum mt-1 font-display text-3xl font-semibold text-navy-900">
              {formatPrice(property.price)}
              {property.transaction === "location" && (
                <span className="text-base font-normal text-navy-400">
                  {" "}
                  /mois
                </span>
              )}
            </p>
            {property.charges && (
              <p className="tnum mt-0.5 text-sm text-navy-500">
                + {property.charges} € de charges (provision)
              </p>
            )}
            <p className="tnum mt-1 text-xs text-navy-400">
              {Math.round(property.price / property.surface).toLocaleString("fr-FR")}{" "}
              €/m²
              {property.transaction === "location" && " /mois"}
            </p>
            <div className="mt-4 border-t border-sand-100 pt-4">
              <PriceAnalysisCard property={property} />
            </div>
          </div>

          <div className="flex items-center justify-around rounded-card border border-sand-200 bg-white p-5 shadow-card">
            <ScoreGauge
              value={property.honestyScore}
              label="Indice de confiance"
              size={110}
            />
            <ScoreGauge
              value={property.qualityScore}
              label="Qualité de l'annonce"
              size={110}
              tone="gold"
            />
          </div>

          {neighborhood && (
            <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
              <p className="mb-3 text-xs font-semibold tracking-wide text-navy-400 uppercase">
                Le quartier
              </p>
              <NeighborhoodScorePanel neighborhood={neighborhood} />
              <Link
                href="/carte"
                className="mt-4 inline-block text-sm font-semibold text-gold-700 hover:text-gold-800"
              >
                Voir sur la carte comparative →
              </Link>
            </div>
          )}

          {owner && <ContactOwnerCard owner={owner} propertyId={property.id} />}
        </aside>
      </div>

      <SimilarProperties propertyId={property.id} />
    </div>
  );
}
