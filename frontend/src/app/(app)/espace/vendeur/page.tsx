import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Eye, FilePlus2, Heart, MessageSquare, TrendingUp } from "lucide-react";
import { properties } from "@/data/properties";
import { offers } from "@/data/community";
import { Button } from "@/components/ui/button";
import { Badge, StatusChip } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-gauge";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionTabsNav } from "@/components/dashboard/section-tabs-nav";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { ListingRowActions } from "@/components/dashboard/listing-row-actions";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Espace vendeur",
  description:
    "Gérez vos annonces, suivez vos offres reçues et vos statistiques de vente sur Immobil'IA.",
};

const myListingIds = ["p-001", "p-003", "p-006", "p-009"];
const myListings = properties.filter((p) => myListingIds.includes(p.id));

const statusLabel: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" | "gold" }> = {
  disponible: { label: "Disponible", tone: "success" },
  sous_offre: { label: "Sous offre", tone: "warning" },
  loue: { label: "Loué", tone: "neutral" },
  vendu: { label: "Vendu", tone: "neutral" },
  brouillon: { label: "Brouillon", tone: "neutral" },
  en_verification: { label: "En vérification", tone: "gold" },
};

const offerStatusLabel: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  en_attente: { label: "En attente", tone: "warning" },
  acceptee: { label: "Acceptée", tone: "success" },
  refusee: { label: "Refusée", tone: "danger" },
  expiree: { label: "Expirée", tone: "danger" },
};

export default function VendorDashboardPage() {
  const totalViews = myListings.reduce((a, p) => a + p.viewCount, 0);
  const totalFavorites = myListings.reduce((a, p) => a + p.favoriteCount, 0);
  const avgQuality = Math.round(
    myListings.reduce((a, p) => a + p.qualityScore, 0) / myListings.length,
  );
  const relevantOffers = offers.filter((o) =>
    myListings.some((p) => p.id === o.propertyId),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
            Espace vendeur / bailleur
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            Suivez vos annonces et laissez l&rsquo;IA optimiser chaque étape,
            du prix au contrat.
          </p>
        </div>
        <Link href="/espace/vendeur/annonces/nouvelle">
          <Button>
            <FilePlus2 className="size-4" aria-hidden />
            Déposer une annonce
          </Button>
        </Link>
      </header>

      <div className="mt-6">
        <SectionTabsNav
          links={[{ href: "/espace/vendeur", label: "Vue d'ensemble" }]}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Eye}
          label="Vues cumulées"
          value={totalViews.toLocaleString("fr-FR")}
          change={12}
        />
        <StatCard
          icon={Heart}
          label="Favoris cumulés"
          value={totalFavorites.toString()}
          change={8}
        />
        <StatCard
          icon={TrendingUp}
          label="Score qualité moyen"
          value={`${avgQuality}/100`}
          tone="gold"
          change={4}
        />
        <StatCard
          icon={MessageSquare}
          label="Offres en attente"
          value={relevantOffers
            .filter((o) => o.status === "en_attente")
            .length.toString()}
        />
      </div>

      {/* Mes annonces */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-navy-900">
          Mes annonces
        </h2>
        <div className="mt-4">
          <Table>
            <THead>
              <Tr>
                <Th>Bien</Th>
                <Th>Statut</Th>
                <Th>Prix</Th>
                <Th>Score qualité</Th>
                <Th>Vues</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {myListings.map((p) => {
                const status = statusLabel[p.status];
                return (
                  <Tr key={p.id}>
                    <Td>
                      <Link
                        href={`/biens/${p.id}`}
                        className="flex items-center gap-3"
                      >
                        <Image
                          src={p.images[0]}
                          alt=""
                          width={48}
                          height={48}
                          className="size-12 shrink-0 rounded-lg object-cover"
                        />
                        <span className="line-clamp-2 max-w-56 text-sm font-medium text-navy-800">
                          {p.title}
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <StatusChip tone={status.tone}>{status.label}</StatusChip>
                    </Td>
                    <Td className="tnum whitespace-nowrap">
                      {formatPrice(p.price)}
                      {p.transaction === "location" && (
                        <span className="text-navy-400">/mois</span>
                      )}
                    </Td>
                    <Td>
                      <ScoreBar value={p.qualityScore} />
                    </Td>
                    <Td className="tnum">{p.viewCount.toLocaleString("fr-FR")}</Td>
                    <Td className="text-right">
                      <ListingRowActions title={p.title} />
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </div>
      </section>

      {/* Offres reçues */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-navy-900">
          Offres reçues
        </h2>
        <div className="mt-4">
          <Table>
            <THead>
              <Tr>
                <Th>Bien</Th>
                <Th>Acquéreur</Th>
                <Th>Montant</Th>
                <Th>Statut</Th>
                <Th>Date</Th>
              </Tr>
            </THead>
            <TBody>
              {relevantOffers.map((o) => {
                const p = properties.find((pp) => pp.id === o.propertyId);
                const status = offerStatusLabel[o.status];
                return (
                  <Tr key={o.id}>
                    <Td className="max-w-56 text-sm font-medium text-navy-800">
                      {p?.title}
                    </Td>
                    <Td>{o.buyerName}</Td>
                    <Td className="tnum font-semibold">{formatPrice(o.amount)}</Td>
                    <Td>
                      <Badge variant={status.tone === "success" ? "success" : status.tone === "danger" ? "danger" : "warning"}>
                        {status.label}
                      </Badge>
                    </Td>
                    <Td className="tnum text-navy-400">{formatDate(o.date)}</Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
