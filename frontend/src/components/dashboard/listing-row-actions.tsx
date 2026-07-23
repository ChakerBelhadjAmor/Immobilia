"use client";

import { MoreHorizontal, PenLine, Trash2 } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";

export function ListingRowActions({ title }: { title: string }) {
  const { toast } = useToast();
  return (
    <Dropdown
      ariaLabel={`Actions pour ${title}`}
      trigger={
        <span className="flex size-8 items-center justify-center rounded-lg text-navy-400 hover:bg-sand-100 hover:text-navy-700">
          <MoreHorizontal className="size-4" aria-hidden />
        </span>
      }
      items={[
        {
          label: "Modifier l'annonce",
          icon: <PenLine className="size-4" aria-hidden />,
          onSelect: () =>
            toast({
              variant: "info",
              title: "Édition indisponible en démo",
              description: "Cette action ouvrirait le formulaire d'édition.",
            }),
        },
        {
          label: "Supprimer",
          icon: <Trash2 className="size-4" aria-hidden />,
          onSelect: () =>
            toast({
              variant: "success",
              title: "Annonce supprimée",
              description: `« ${title} » a été retirée (démo).`,
            }),
          destructive: true,
        },
      ]}
    />
  );
}
