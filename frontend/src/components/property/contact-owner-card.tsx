"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BadgeCheck, MessageCircle, Star } from "lucide-react";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function ContactOwnerCard({
  owner,
  propertyId,
}: {
  owner: User;
  propertyId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
      <p className="text-xs font-semibold tracking-wide text-navy-400 uppercase">
        Proposé par
      </p>
      <div className="mt-3 flex items-center gap-3">
        <Image
          src={owner.avatarUrl}
          alt=""
          width={48}
          height={48}
          className="size-12 rounded-full"
        />
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
            {owner.firstName} {owner.lastName}
            {owner.verified && (
              <BadgeCheck
                className="size-4 text-success-500"
                aria-label="Profil vérifié"
              />
            )}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-400">
            <Star className="size-3.5 fill-gold-500 text-gold-500" aria-hidden />
            <span className="tnum">
              {owner.rating.toLocaleString("fr-FR")} · {owner.reviewCount} avis
            </span>
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <Button onClick={() => router.push("/messages")}>
          <MessageCircle className="size-4" aria-hidden />
          Envoyer un message
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast({
              variant: "success",
              title: "Demande de visite envoyée",
              description:
                "Le propriétaire vous proposera des créneaux par message.",
            })
          }
        >
          Demander une visite
        </Button>
      </div>
    </div>
  );
}
