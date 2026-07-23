import type { Metadata } from "next";
import { FavoritesPageClient } from "@/components/property/favorites-page-client";

export const metadata: Metadata = {
  title: "Mes favoris",
  description: "Retrouvez les biens que vous avez enregistrés en favoris.",
};

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
