import type { Metadata } from "next";
import { MapPageClient } from "@/components/maps/map-page-client";

export const metadata: Metadata = {
  title: "Carte comparative des offres",
  description:
    "Visualisez les offres par quartier : prix, points d'intérêt, bruit, écoles, transports et alertes qualité de quartier.",
};

export default function MapPage() {
  return <MapPageClient />;
}
