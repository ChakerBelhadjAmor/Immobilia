import type { Metadata } from "next";
import { ComparePageClient } from "@/components/property/compare-page-client";

export const metadata: Metadata = {
  title: "Comparer des biens",
  description:
    "Chat comparatif multi-biens : demandez à l'IA de comparer plusieurs annonces et obtenez un tableau de synthèse.",
};

export default function ComparePage() {
  return <ComparePageClient />;
}
