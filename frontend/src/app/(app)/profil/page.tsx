import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, Mail, ShieldCheck, Star } from "lucide-react";
import { currentUser } from "@/data/users";
import { searchHistory } from "@/data/community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mon profil",
  description: "Gérez vos informations personnelles et vos préférences Immobil'IA.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-5">
        <Image
          src={currentUser.avatarUrl}
          alt=""
          width={80}
          height={80}
          className="size-20 rounded-full"
        />
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-navy-900">
            {currentUser.firstName} {currentUser.lastName}
            {currentUser.verified && (
              <BadgeCheck className="size-5 text-success-500" aria-label="Profil vérifié" />
            )}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-500">
            <Mail className="size-4" aria-hidden />
            {currentUser.email}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-500">
            <Star className="size-4 fill-gold-500 text-gold-500" aria-hidden />
            <span className="tnum">
              {currentUser.rating} · {currentUser.reviewCount} avis
            </span>
            <span className="text-navy-300">·</span>
            Membre depuis {formatDate(currentUser.memberSince)}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Tabs
          items={[
            {
              id: "infos",
              label: "Informations",
              content: (
                <div className="max-w-lg space-y-4 rounded-card border border-sand-200 bg-white p-5 shadow-card">
                  <Input label="Prénom" defaultValue={currentUser.firstName} />
                  <Input label="Nom" defaultValue={currentUser.lastName} />
                  <Input label="E-mail" type="email" defaultValue={currentUser.email} />
                  <Button>Enregistrer les modifications</Button>
                </div>
              ),
            },
            {
              id: "recherches",
              label: "Historique de recherche",
              content: (
                <ul className="space-y-3">
                  {searchHistory.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-sand-200 bg-white p-4 shadow-card"
                    >
                      <div>
                        <p className="text-sm text-navy-800">{item.query}</p>
                        <p className="mt-1 text-xs text-navy-400">
                          {formatDate(item.date)} · {item.resultCount} résultats
                        </p>
                      </div>
                      {item.alertEnabled && (
                        <Badge variant="gold">Alerte active</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              ),
            },
            {
              id: "securite",
              label: "Sécurité",
              content: (
                <div className="max-w-lg space-y-4 rounded-card border border-sand-200 bg-white p-5 shadow-card">
                  <div className="flex items-center gap-3 rounded-lg bg-success-50 p-3.5 text-sm text-success-700">
                    <ShieldCheck className="size-5 shrink-0" aria-hidden />
                    Votre compte est protégé par une vérification d&rsquo;identité.
                  </div>
                  <Input label="Mot de passe actuel" type="password" />
                  <Input label="Nouveau mot de passe" type="password" />
                  <Button variant="outline">Mettre à jour le mot de passe</Button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
