"use client";

import { useEffect, useState } from "react";
import { BellPlus, BellRing } from "lucide-react";
import type { Property } from "@/types";
import { fetchSimilarProperties } from "@/services/property-service";
import { PropertyCard } from "./property-card";
import { PropertyCardSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** EF-L-14 — similar listings + "notify me of similar offers" alert. */
export function SimilarProperties({ propertyId }: { propertyId: string }) {
  const [similar, setSimilar] = useState<Property[] | null>(null);
  const [alertOn, setAlertOn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSimilarProperties(propertyId).then(setSimilar);
  }, [propertyId]);

  const toggleAlert = () => {
    setAlertOn((v) => !v);
    toast({
      variant: alertOn ? "info" : "success",
      title: alertOn ? "Alerte désactivée" : "Alerte activée",
      description: alertOn
        ? "Vous ne recevrez plus de notification pour ce type de bien."
        : "Vous serez notifiée dès qu'une offre similaire à celle-ci sera publiée.",
    });
  };

  return (
    <section aria-labelledby="similar-title" className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="similar-title"
          className="font-display text-xl font-semibold text-navy-900"
        >
          Biens similaires
        </h2>
        <Button
          variant={alertOn ? "secondary" : "outline"}
          size="sm"
          onClick={toggleAlert}
          aria-pressed={alertOn}
        >
          {alertOn ? (
            <BellRing className="size-4 text-gold-600" aria-hidden />
          ) : (
            <BellPlus className="size-4" aria-hidden />
          )}
          {alertOn ? "Alerte active" : "M'alerter des offres similaires"}
        </Button>
      </div>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {similar === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))
          : similar.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>
    </section>
  );
}
