"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Reveal, SectionHeading } from "./reveal";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Comment l'IA calcule-t-elle le prix recommandé ?",
    a: "Le moteur croise les transactions réelles des 6 derniers mois dans le quartier (base DVF), les annonces concurrentes actives, les caractéristiques du bien (surface, étage, DPE, prestations) et la tension du marché local. Le résultat est une fourchette avec un prix conseillé — vous restez libre de l'accepter ou de l'ignorer.",
  },
  {
    q: "Qu'est-ce que le score d'honnêteté d'une annonce ?",
    a: "Un indice de 0 à 100 qui mesure la fiabilité d'une annonce : cohérence entre photos et description, écart au prix de marché, réutilisation d'images sur d'autres sites, historique du vendeur et signalements. Les résultats de recherche sont classés pour faire remonter les annonces les plus fiables.",
  },
  {
    q: "Comment fonctionne la détection d'arnaques ?",
    a: "Trois niveaux : recherche par image inversée pour vérifier qu'un bien n'est pas déjà loué ou publié ailleurs à un prix différent, détection de formulations caractéristiques des fraudes (paiement en espèces, mandats cash), et analyse des incohérences de l'annonce. Vous pouvez aussi signaler un comportement suspect en deux clics.",
  },
  {
    q: "Les contrats générés sont-ils juridiquement valables ?",
    a: "Les contrats suivent les modèles types définis par la loi (décret du 29 mai 2015 pour les baux, clauses standard des compromis). Ils constituent une base solide et conforme, mais nous recommandons la relecture par un notaire ou un avocat pour les situations particulières. L'IA vérifie aussi les contrats reçus et signale les clauses illégales.",
  },
  {
    q: "D'où viennent les annonces « web » agrégées ?",
    a: "En plus des annonces déposées sur la plateforme, Immobil'IA agrège les offres publiques des principaux portails immobiliers. Elles sont clairement étiquetées avec leur source et passent par la même analyse de fiabilité que les annonces natives.",
  },
  {
    q: "Que simulent les scénarios « et si » pour les investisseurs ?",
    a: "Trois familles de scénarios : l'impact de travaux (rénovation, amélioration DPE) sur le loyer et la valeur, l'évolution du quartier (nouveaux transports, projets urbains) sur la plus-value, et la variation des taux d'intérêt sur votre cash-flow et votre capacité de revente.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-sand-100 py-24 sm:py-32" id="faq">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Questions fréquentes"
          title="Tout ce que vous vous demandez"
        />
        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={faq.q} delay={i * 0.04}>
                <div className="overflow-hidden rounded-xl border border-sand-200 bg-white shadow-card">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4.5 text-left"
                  >
                    <span className="text-sm font-semibold text-navy-900 sm:text-base">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-5 shrink-0 text-gold-600 transition-transform duration-200",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        <p className="px-6 pb-5 text-sm leading-relaxed text-navy-600">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
