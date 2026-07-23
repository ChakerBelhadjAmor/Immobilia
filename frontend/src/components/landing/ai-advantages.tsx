"use client";

import { motion } from "framer-motion";
import {
  Film,
  Gauge,
  Scale,
  ShieldCheck,
  Users,
  Wand2,
} from "lucide-react";
import { Reveal, SectionHeading } from "./reveal";
import { ScoreGauge } from "@/components/ui/score-gauge";

const advantages = [
  {
    icon: Gauge,
    title: "Score d'honnêteté des annonces",
    text: "Chaque annonce est confrontée au marché : écart de prix, incohérences photo/description, historique. Les plus fiables remontent en premier.",
  },
  {
    icon: ShieldCheck,
    title: "Détection d'arnaques et de discriminations",
    text: "Formulations illégales, biens déjà loués, paiements suspects : l'IA alerte avant que vous ne vous engagiez.",
  },
  {
    icon: Film,
    title: "Visite virtuelle générée",
    text: "À partir de vos photos et vidéos brutes, une visite virtuelle fluide et réaliste, associée à l'annonce.",
  },
  {
    icon: Scale,
    title: "Conformité juridique automatique",
    text: "Réglementations applicables, contrat type conforme à la loi française, vérification du contrat de la partie adverse.",
  },
  {
    icon: Wand2,
    title: "Décoration et home staging",
    text: "Idées de décoration selon budget et préférences, mode avant/après pour visualiser le potentiel d'un bien.",
  },
  {
    icon: Users,
    title: "Matching colocation",
    text: "Profils compatibles selon rythme de vie, budget et habitudes — la colocation qui fonctionne vraiment.",
  },
];

export function AiAdvantages() {
  return (
    <section className="bg-sand-100 py-24 sm:py-32" id="ia">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Pourquoi Immobil'IA"
              title="Une IA qui protège vos intérêts, pas seulement vos filtres"
              description="Les portails classiques affichent des annonces. Immobil'IA les interroge : le prix est-il juste ? Le bien existe-t-il encore ? Le contrat est-il légal ?"
            />
            <Reveal delay={0.2} className="mt-10">
              <div className="flex items-center gap-8 rounded-card border border-sand-300 bg-white p-6 shadow-card">
                <ScoreGauge value={94} label="Indice de confiance" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy-800">
                    Appartement haussmannien — Les Batignolles
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-navy-500">
                    <li>✓ Prix cohérent avec 42 transactions comparables</li>
                    <li>✓ Photos vérifiées, aucune réutilisation détectée</li>
                    <li>✓ Description conforme au diagnostic</li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {advantages.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.06}>
                <motion.article
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="h-full rounded-card border border-sand-200 bg-white p-6 shadow-card"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
                    <a.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-navy-900">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">
                    {a.text}
                  </p>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
