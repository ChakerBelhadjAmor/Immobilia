"use client";

import { Camera, Film, ImagePlus, Video } from "lucide-react";
import type { ListingDraft } from "./wizard-types";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** EF-V-01 — deposit an offer: type, location, media. */
export function StepBasics({
  draft,
  onChange,
}: {
  draft: ListingDraft;
  onChange: (patch: Partial<ListingDraft>) => void;
}) {
  const mockPhotos = Array.from({ length: draft.photoCount });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Titre de l'annonce"
          required
          placeholder="Appartement 3 pièces avec balcon"
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <Input
          label="Ville"
          required
          placeholder="Lyon 4e"
          value={draft.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
        <Select
          label="Type de bien"
          value={draft.type}
          onChange={(e) => onChange({ type: e.target.value as ListingDraft["type"] })}
        >
          <option value="appartement">Appartement</option>
          <option value="maison">Maison</option>
          <option value="studio">Studio</option>
          <option value="loft">Loft</option>
          <option value="duplex">Duplex</option>
          <option value="immeuble">Immeuble</option>
        </Select>
        <Select
          label="Transaction"
          value={draft.transaction}
          onChange={(e) =>
            onChange({ transaction: e.target.value as ListingDraft["transaction"] })
          }
        >
          <option value="vente">Vente</option>
          <option value="location">Location</option>
        </Select>
        <Input
          label="Surface (m²)"
          type="number"
          required
          value={draft.surface}
          onChange={(e) => onChange({ surface: Number(e.target.value) })}
        />
        <Input
          label="Nombre de pièces"
          type="number"
          required
          value={draft.rooms}
          onChange={(e) => onChange({ rooms: Number(e.target.value) })}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-navy-800">Photos du bien</p>
        <p className="mt-0.5 text-xs text-navy-400">
          5 photos minimum recommandées. L&rsquo;IA analysera la cohérence
          avec votre description.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {mockPhotos.map((_, i) => (
            <div
              key={i}
              className="relative flex aspect-square items-center justify-center rounded-xl border border-sand-300 bg-sand-100 text-navy-300"
            >
              <Camera className="size-5" aria-hidden />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ photoCount: Math.min(draft.photoCount + 1, 10) })}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-sand-300 text-navy-400 transition-colors hover:border-gold-500 hover:text-gold-600"
          >
            <ImagePlus className="size-5" aria-hidden />
            <span className="text-[11px] font-medium">Ajouter</span>
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-navy-800">Vidéo de visite</p>
        <button
          type="button"
          onClick={() => onChange({ hasVideo: !draft.hasVideo })}
          className={cn(
            "mt-2 flex w-full items-center gap-3 rounded-xl border-2 border-dashed p-4 text-left transition-colors sm:w-auto sm:min-w-80",
            draft.hasVideo
              ? "border-success-500/50 bg-success-50"
              : "border-sand-300 hover:border-gold-500",
          )}
        >
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-lg",
              draft.hasVideo ? "bg-success-500 text-white" : "bg-sand-200 text-navy-400",
            )}
          >
            {draft.hasVideo ? <Video className="size-5" /> : <Film className="size-5" />}
          </span>
          <span>
            <span className="block text-sm font-medium text-navy-800">
              {draft.hasVideo ? "Vidéo ajoutée" : "Ajouter une vidéo brute"}
            </span>
            <span className="block text-xs text-navy-400">
              {draft.hasVideo
                ? "Elle servira à générer votre visite virtuelle IA."
                : "Facultatif, mais améliore fortement le score de qualité."}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
