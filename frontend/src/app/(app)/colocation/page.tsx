import type { Metadata } from "next";
import { ColocationPageClient } from "@/components/colocation/colocation-page-client";

export const metadata: Metadata = {
  title: "Trouver une colocation",
  description:
    "L'IA propose un appariement de profils compatibles pour votre recherche de colocation : rythme de vie, budget, habitudes.",
};

export default function ColocationPage() {
  return <ColocationPageClient />;
}
