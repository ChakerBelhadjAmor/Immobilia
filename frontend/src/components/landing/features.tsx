"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeEuro,
  Camera,
  FileCheck2,
  Landmark,
  MapPinned,
  MessagesSquare,
  ScanSearch,
  ShieldAlert,
  Sofa,
} from "lucide-react";
import { Reveal, SectionHeading } from "./reveal";

const audiences = [
  {
    id: "vendeur",
    title: "Vous vendez ou louez",
    description:
      "Déposez votre annonce, l'IA fait le reste : prix recommandé, score de qualité, contrat conforme.",
    href: "/espace/vendeur",
    features: [
      {
        icon: BadgeEuro,
        title: "Prix recommandé",
        text: "Estimation calibrée sur les transactions réelles du quartier, avec alerte en cas d'écart marché.",
      },
      {
        icon: Camera,
        title: "Score de qualité d'annonce",
        text: "Angle de photo manquant, luminosité, description trop courte : des corrections concrètes, un score qui progresse.",
      },
      {
        icon: FileCheck2,
        title: "Contrat conforme généré",
        text: "Réglementations applicables et contrat type conforme à la loi française, généré en un clic.",
      },
    ],
  },
  {
    id: "acheteur",
    title: "Vous cherchez un bien",
    description:
      "Décrivez votre vie, pas des filtres. La recherche hybride agrège la plateforme et le web.",
    href: "/recherche",
    features: [
      {
        icon: ScanSearch,
        title: "Recherche en langage naturel",
        text: "« 3 pièces calme pour télétravail, budget 450 k€, école à pied » — l'IA comprend et trouve.",
      },
      {
        icon: MapPinned,
        title: "Carte comparative",
        text: "Prix, bruit, pollution, écoles, transports : toutes les offres et leurs quartiers, sur une seule carte.",
      },
      {
        icon: ShieldAlert,
        title: "Anti-arnaque par image",
        text: "Vérification que le bien n'est pas déjà loué ailleurs, par recherche d'image inversée.",
      },
    ],
  },
  {
    id: "investisseur",
    title: "Vous investissez",
    description:
      "Rendement, risque, plus-value à 10 ans : décidez sur des données, pas des intuitions.",
    href: "/espace/investisseur",
    features: [
      {
        icon: Landmark,
        title: "Rapport d'investissement",
        text: "Simulation de rentabilité locative complète : rendement net, cash-flow, horizon de récupération.",
      },
      {
        icon: MessagesSquare,
        title: "Scénarios « et si »",
        text: "Travaux, évolution du quartier, variation des taux : mesurez l'impact avant de signer.",
      },
      {
        icon: Sofa,
        title: "Score de risque locatif",
        text: "Zone tendue, vacance moyenne, profil des locataires : un score, quatre facteurs expliqués.",
      },
    ],
  },
];

export function Features() {
  return (
    <section className="bg-sand-50 py-24 sm:py-32" id="fonctionnalites">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Trois profils, une plateforme"
          title="Chaque acteur de l'immobilier a son copilote"
          description="Vendeur, chercheur ou investisseur : Immobil'IA adapte ses analyses à votre objectif."
        />
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {audiences.map((audience, i) => (
            <Reveal key={audience.id} delay={i * 0.1}>
              <article className="flex h-full flex-col rounded-card border border-sand-200 bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover">
                <h3 className="font-display text-xl font-semibold text-navy-900">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">
                  {audience.description}
                </p>
                <ul className="mt-7 flex-1 space-y-6">
                  {audience.features.map((f) => (
                    <li key={f.title} className="flex gap-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700">
                        <f.icon className="size-4.5" aria-hidden />
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-navy-800">
                          {f.title}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-navy-500">
                          {f.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link
                  href={audience.href}
                  className="group mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 transition-colors hover:text-gold-800"
                >
                  Découvrir
                  <motion.span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </motion.span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
