import type { Metadata } from "next";
import { ListingWizard } from "@/components/vendor/listing-wizard";

export const metadata: Metadata = {
  title: "Déposer une annonce",
  description:
    "Déposez votre annonce en quelques étapes : prix recommandé, score de qualité, conformité légale générée par l'IA.",
};

export default function NewListingPage() {
  return <ListingWizard />;
}
