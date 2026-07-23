"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, PartyPopper, Rocket } from "lucide-react";
import type { ListingDraft } from "./wizard-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatSurface } from "@/lib/utils";

/** Final review + EF-V-06 virtual-tour generation + publish. */
export function StepPublish({ draft }: { draft: ListingDraft }) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [generatingTour, setGeneratingTour] = useState(false);
  const [tourReady, setTourReady] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const publish = async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 1300));
    setPublishing(false);
    setPublished(true);
    toast({
      variant: "success",
      title: "Annonce publiée",
      description: "Votre annonce est désormais visible par les acheteurs.",
    });
    if (draft.hasVideo) {
      setGeneratingTour(true);
      setTimeout(() => {
        setGeneratingTour(false);
        setTourReady(true);
      }, 2200);
    }
  };

  if (published) {
    return (
      <div className="flex flex-col items-center rounded-card border border-success-500/30 bg-success-50 px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-500 text-white">
          <PartyPopper className="size-6" aria-hidden />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-navy-900">
          Votre annonce est en ligne
        </h3>
        <p className="mt-2 max-w-md text-sm text-navy-500">
          {draft.title || "Votre bien"} est maintenant visible dans les
          résultats de recherche.
        </p>

        {draft.hasVideo && (
          <div className="mt-6 w-full max-w-md rounded-xl border border-sand-200 bg-white p-4 text-left">
            <div className="flex items-center gap-3">
              <span
                className={
                  "flex size-9 shrink-0 items-center justify-center rounded-lg " +
                  (tourReady ? "bg-gold-500 text-navy-950" : "bg-sand-200 text-navy-400")
                }
              >
                <Film className="size-4" aria-hidden />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">
                  Visite virtuelle IA
                </p>
                <p className="text-xs text-navy-400">
                  {generatingTour
                    ? "Génération en cours à partir de vos photos et vidéo…"
                    : tourReady
                      ? "Visite virtuelle générée et associée à l'annonce."
                      : "En file d'attente…"}
                </p>
              </div>
              {generatingTour && (
                <span className="size-4 animate-spin rounded-full border-2 border-gold-300 border-t-gold-600" />
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Button onClick={() => router.push("/espace/vendeur")}>
            Voir mes annonces
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-sand-200 bg-white p-6">
        <h3 className="font-display text-lg font-semibold text-navy-900">
          {draft.title || "Votre annonce"}
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Ville", value: draft.city || "—" },
            {
              label: draft.transaction === "vente" ? "Prix" : "Loyer",
              value: formatPrice(draft.price),
            },
            { label: "Surface", value: formatSurface(draft.surface) },
            { label: "Pièces", value: `${draft.rooms}` },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-navy-400">{item.label}</p>
              <p className="tnum mt-0.5 text-sm font-semibold text-navy-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="sand">{draft.photoCount} photos</Badge>
          {draft.hasVideo && <Badge variant="gold">Vidéo fournie</Badge>}
          <Badge variant="outline" className="capitalize">
            {draft.type}
          </Badge>
        </div>
      </div>

      <Button size="lg" className="w-full" onClick={publish} loading={publishing}>
        <Rocket className="size-4" aria-hidden />
        {publishing ? "Publication…" : "Publier mon annonce"}
      </Button>
    </div>
  );
}
