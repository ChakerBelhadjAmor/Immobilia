/* ------------------------------------------------------------------
   AI service — mock implementation of every IA feature.
   Deterministic outputs derived from inputs, so the UI behaves
   consistently. Each function mirrors a future POST /api/ai/* call.
------------------------------------------------------------------ */

import { delay } from "@/lib/utils";
import { getPropertyById, properties } from "@/data/properties";
import type {
  ChargesRecommendation,
  ComparisonResult,
  DescriptionIssue,
  FraudAlert,
  GeneratedContract,
  PriceRecommendation,
  QualityScoreResult,
  VisitQuestion,
} from "@/types";

/* ---------------------- EF-V-02 : prix ---------------------- */

export async function recommendPrice(input: {
  price: number;
  surface: number;
  city: string;
  transaction: "vente" | "location";
}): Promise<PriceRecommendation> {
  await delay(1600);
  const sqmBase = input.transaction === "vente" ? 5200 : 16;
  const cityFactor = input.city.toLowerCase().includes("paris")
    ? 2.2
    : input.city.toLowerCase().includes("lyon")
      ? 1.15
      : 1;
  const recommended = Math.round((input.surface * sqmBase * cityFactor) / 100) * 100;
  const deltaPercent = Math.round(((input.price - recommended) / recommended) * 100);
  const verdict =
    deltaPercent > 5 ? "trop_eleve" : deltaPercent < -5 ? "trop_faible" : "correct";
  return {
    recommended,
    marketLow: Math.round(recommended * 0.93),
    marketHigh: Math.round(recommended * 1.07),
    verdict,
    deltaPercent,
    rationale:
      verdict === "trop_eleve"
        ? `Votre prix dépasse de ${deltaPercent} % la fourchette observée sur 42 transactions comparables des 6 derniers mois dans ce secteur. Au-delà de +5 %, le délai de vente moyen passe de 45 à 96 jours.`
        : verdict === "trop_faible"
          ? `Votre prix est ${Math.abs(deltaPercent)} % sous le marché. Vous pourriez laisser jusqu'à ${Math.round((recommended - input.price) / 1000)} k€ sur la table — sauf stratégie de vente rapide assumée.`
          : "Votre prix se situe dans la fourchette du marché : bon équilibre entre attractivité et valorisation. Délai de vente estimé : 40 à 55 jours.",
  };
}

/* ---------------------- EF-V-03 : charges ---------------------- */

export async function recommendCharges(input: {
  surface: number;
  type: string;
}): Promise<ChargesRecommendation> {
  await delay(1100);
  const base = Math.round(input.surface * 1.9);
  return {
    monthly: base,
    breakdown: [
      { label: "Entretien parties communes", amount: Math.round(base * 0.32) },
      { label: "Eau froide", amount: Math.round(base * 0.24) },
      { label: "Chauffage collectif (provision)", amount: Math.round(base * 0.28) },
      { label: "Taxe ordures ménagères", amount: Math.round(base * 0.16) },
    ],
    note: "Provision mensuelle recommandée avec régularisation annuelle, conforme à la loi du 6 juillet 1989 (art. 23). Intégrez ce détail à l'annonce : les dossiers aboutissent 30 % plus vite quand les charges sont détaillées.",
  };
}

/* ---------------------- EF-V-05 : vérification description ---------------------- */

export async function verifyDescription(input: {
  description: string;
  surface?: number;
  rooms?: number;
  photoCount: number;
}): Promise<DescriptionIssue[]> {
  await delay(1400);
  const issues: DescriptionIssue[] = [];
  const text = input.description.toLowerCase();

  if (input.description.length < 200) {
    issues.push({
      severity: "warning",
      field: "Description",
      message:
        "Description trop courte (moins de 200 caractères). Les annonces de 600 caractères et plus reçoivent 2,4× plus de contacts.",
    });
  }
  if (input.photoCount < 3) {
    issues.push({
      severity: "error",
      field: "Photos",
      message: `Seulement ${input.photoCount} photo(s) analysée(s) : la cuisine et la salle de bains ne sont pas visibles. 5 photos minimum recommandées.`,
    });
  }
  if (input.surface && !text.includes(String(input.surface))) {
    issues.push({
      severity: "warning",
      field: "Surface",
      message: `La surface saisie (${input.surface} m²) n'apparaît pas dans la description. Incohérence possible avec les photos analysées (estimation visuelle : ${Math.round(input.surface * 0.92)}–${Math.round(input.surface * 1.05)} m²).`,
    });
  }
  if (!text.includes("dpe") && !text.includes("énergie") && !text.includes("classe")) {
    issues.push({
      severity: "error",
      field: "DPE",
      message:
        "Classe énergétique absente : mention obligatoire depuis le 1er janvier 2011 (loi Grenelle II). L'annonce ne peut pas être publiée sans DPE.",
    });
  }
  if (!text.includes("charge") ) {
    issues.push({
      severity: "info",
      field: "Charges",
      message: "Aucune mention des charges. Recommandé pour la transparence de l'annonce.",
    });
  }
  if (issues.length === 0) {
    issues.push({
      severity: "info",
      field: "Analyse globale",
      message: "Aucune incohérence détectée entre la description, les photos et les caractéristiques saisies.",
    });
  }
  return issues;
}

/* ---------------------- EF-V-07 : score qualité ---------------------- */

export async function computeQualityScore(input: {
  photoCount: number;
  descriptionLength: number;
  hasVideo: boolean;
  priceSet: boolean;
}): Promise<QualityScoreResult> {
  await delay(1200);
  const suggestions = [
    {
      label: "Ajouter une photo de la salle de bains (angle manquant)",
      impact: 6,
      done: input.photoCount >= 5,
    },
    {
      label: "Corriger la luminosité des photos du séjour (sous-exposées de 1,5 IL)",
      impact: 4,
      done: false,
    },
    {
      label: "Étoffer la description (minimum 600 caractères)",
      impact: 8,
      done: input.descriptionLength >= 600,
    },
    {
      label: "Ajouter une vidéo ou une visite virtuelle",
      impact: 10,
      done: input.hasVideo,
    },
    {
      label: "Renseigner un prix aligné sur l'estimation IA",
      impact: 5,
      done: input.priceSet,
    },
  ];
  const score =
    52 + suggestions.filter((s) => s.done).reduce((acc, s) => acc + s.impact, 0) +
    Math.min(input.photoCount * 3, 15);
  return { score: Math.min(score, 98), suggestions };
}

/* ---------------------- EF-V-09 : anti-fraude / discrimination ---------------------- */

const discriminationPatterns: { pattern: RegExp; reason: string; law: string }[] = [
  {
    pattern: /pas d[e']étrangers?|français uniquement|européens? seulement/i,
    reason: "Discrimination fondée sur l'origine ou la nationalité",
    law: "Art. 225-1 et 225-2 du Code pénal — jusqu'à 3 ans d'emprisonnement et 45 000 € d'amende",
  },
  {
    pattern: /pas de (familles?|enfants?)|sans enfants?/i,
    reason: "Discrimination fondée sur la situation de famille",
    law: "Art. 225-1 du Code pénal ; loi du 6 juillet 1989, art. 1er",
  },
  {
    pattern: /pas de (chômeurs?|rsa|caf|aides? sociales?)/i,
    reason: "Discrimination fondée sur la vulnérabilité économique",
    law: "Art. 225-1 du Code pénal (critère ajouté par la loi du 24 juin 2016)",
  },
  {
    pattern: /(jeunes?|moins de \d+ ans|retraités? s'abstenir|personnes? âgées? s'abstenir)/i,
    reason: "Discrimination fondée sur l'âge",
    law: "Art. 225-1 du Code pénal",
  },
  {
    pattern: /caution en (espèces?|liquide)|paiement (cash|en liquide) exigé/i,
    reason: "Pratique illégale : le dépôt de garantie en espèces sans quittance est un signal de fraude",
    law: "Loi du 6 juillet 1989, art. 22",
  },
  {
    pattern: /virement (western union|moneygram)|mandat cash/i,
    reason: "Mode de paiement caractéristique des arnaques à la location",
    law: "Signalement recommandé sur la plateforme Perceval / THESEE",
  },
];

export async function detectFraud(text: string): Promise<FraudAlert[]> {
  await delay(900);
  const alerts: FraudAlert[] = [];
  for (const { pattern, reason, law } of discriminationPatterns) {
    const match = text.match(pattern);
    if (match) {
      alerts.push({
        severity: "error",
        excerpt: match[0],
        reason,
        law,
      });
    }
  }
  return alerts;
}

/* ---------------------- EF-V-08 / EF-L-06 : réglementations + contrat ---------------------- */

export async function generateContract(input: {
  transaction: "vente" | "location";
  city: string;
  verify?: boolean;
}): Promise<GeneratedContract> {
  await delay(1800);
  const isRent = input.transaction === "location";
  return {
    title: isRent
      ? "Contrat de location — logement nu à usage de résidence principale"
      : "Compromis de vente — promesse synallagmatique",
    reference: `IMM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    sections: isRent
      ? [
          {
            title: "Article 1 — Désignation des parties",
            content:
              "Le présent contrat est conclu entre le bailleur, désigné ci-après « le Bailleur », et le(s) locataire(s), désigné(s) ci-après « le Locataire », conformément à la loi n° 89-462 du 6 juillet 1989 et au décret n° 2015-587 du 29 mai 2015 fixant le contrat type.",
          },
          {
            title: "Article 2 — Objet et description du logement",
            content:
              "Le Bailleur donne en location le logement décrit en annexe (surface habitable loi Boutin, nombre de pièces principales, équipements). Le logement est loué à usage exclusif de résidence principale.",
          },
          {
            title: "Article 3 — Durée du bail",
            content:
              "Le bail est conclu pour une durée de trois ans (bailleur personne physique), renouvelable tacitement. Congé du locataire : préavis d'un mois en zone tendue (décret n° 2013-392).",
          },
          {
            title: "Article 4 — Loyer et charges",
            content:
              "Le loyer mensuel est payable à terme échu. En zone d'encadrement des loyers (décret du 1er juin 2015 pour Paris), le loyer ne peut excéder le loyer de référence majoré. Les charges sont récupérées par provision avec régularisation annuelle (art. 23, loi de 1989).",
          },
          {
            title: "Article 5 — Dépôt de garantie",
            content:
              "Le dépôt de garantie ne peut excéder un mois de loyer hors charges (location nue). Restitution sous un mois si l'état des lieux de sortie est conforme, deux mois sinon (art. 22).",
          },
          {
            title: "Article 6 — Diagnostics annexés",
            content:
              "Sont annexés : DPE, CREP (constat de risque d'exposition au plomb), état de l'installation électrique et gaz si + de 15 ans, ERP (état des risques et pollutions), diagnostic bruit le cas échéant (aérodromes).",
          },
        ]
      : [
          {
            title: "Article 1 — Désignation des parties et du bien",
            content:
              "Le présent compromis est conclu entre le Vendeur et l'Acquéreur pour le bien désigné, libre de toute occupation, avec désignation cadastrale complète et origine de propriété trentenaire.",
          },
          {
            title: "Article 2 — Prix et modalités de paiement",
            content:
              "Le prix de vente est stipulé net vendeur, frais d'acte à la charge de l'Acquéreur. Un dépôt de garantie de 5 à 10 % est séquestré chez le notaire jusqu'à la réitération authentique.",
          },
          {
            title: "Article 3 — Délai de rétractation",
            content:
              "L'Acquéreur non professionnel dispose d'un délai de rétractation de dix jours (art. L. 271-1 du CCH) à compter de la notification du compromis signé.",
          },
          {
            title: "Article 4 — Conditions suspensives",
            content:
              "Condition suspensive d'obtention de prêt (loi Scrivener, art. L. 313-41 du Code de la consommation) : montant, taux maximal et durée mentionnés. Délai minimal d'un mois.",
          },
          {
            title: "Article 5 — Diagnostics techniques",
            content:
              "Dossier de diagnostic technique annexé : DPE, amiante, plomb, termites (zones concernées), électricité/gaz, assainissement, ERP, métrage loi Carrez pour les lots de copropriété.",
          },
          {
            title: "Article 6 — Réitération authentique",
            content:
              "La vente sera réitérée par acte authentique au plus tard à la date convenue. À défaut, la partie non défaillante pourra poursuivre l'exécution forcée ou percevoir l'indemnité d'immobilisation.",
          },
        ],
    regulations: isRent
      ? [
          {
            title: "Encadrement des loyers",
            description:
              input.city.toLowerCase().includes("paris")
                ? "Paris est en zone d'encadrement : loyer plafonné au loyer de référence majoré (+20 %). Complément de loyer à justifier."
                : "Vérifiez si la commune est en zone tendue : préavis réduit et encadrement de l'évolution des loyers à la relocation.",
            mandatory: true,
          },
          {
            title: "DPE et décence énergétique",
            description:
              "Depuis le 1er janvier 2025, les logements classés G sont interdits à la location (loi Climat et Résilience). Les F le seront en 2028.",
            mandatory: true,
          },
          {
            title: "Permis de louer",
            description:
              "Certaines communes exigent une autorisation préalable de mise en location (art. L. 635-1 du CCH). Vérification faite : non requis pour cette adresse.",
            mandatory: false,
          },
          {
            title: "Assurance habitation",
            description:
              "Le locataire doit justifier d'une assurance risques locatifs à la remise des clés puis chaque année.",
            mandatory: true,
          },
        ]
      : [
          {
            title: "Diagnostics obligatoires",
            description:
              "DPE opposable depuis juillet 2021, amiante (permis < 1997), plomb (< 1949), termites selon arrêté préfectoral, métrage Carrez en copropriété.",
            mandatory: true,
          },
          {
            title: "Droit de préemption",
            description:
              "La commune peut disposer d'un droit de préemption urbain (DPU). La déclaration d'intention d'aliéner (DIA) sera purgée par le notaire.",
            mandatory: true,
          },
          {
            title: "Plus-value immobilière",
            description:
              "Exonération totale pour la résidence principale ; sinon abattement progressif (exonération IR à 22 ans, prélèvements sociaux à 30 ans).",
            mandatory: false,
          },
        ],
    verified: input.verify ? true : undefined,
    verificationIssues: input.verify
      ? [
          "Le dépôt de garantie stipulé (2 mois) excède le plafond légal d'un mois pour une location nue — clause réputée non écrite (art. 22, loi de 1989).",
          "La clause d'indexation ne précise pas l'IRL de référence : à compléter avec le trimestre de révision.",
        ]
      : undefined,
  };
}

/* ---------------------- EF-L-07 : questions de visite ---------------------- */

export async function suggestVisitQuestions(
  propertyType: string,
): Promise<VisitQuestion[]> {
  await delay(800);
  const common: VisitQuestion[] = [
    {
      category: "Charges & copropriété",
      question: "Quel est le montant exact des charges annuelles et que couvrent-elles ?",
      why: "Les provisions affichées sous-estiment souvent la régularisation annuelle.",
    },
    {
      category: "Travaux",
      question: "Des travaux de copropriété sont-ils votés ou à l'étude (ravalement, toiture, ascenseur) ?",
      why: "Un ravalement voté avant la vente reste à la charge du vendeur ; à l'étude, il sera pour vous.",
    },
    {
      category: "Énergie",
      question: "Puis-je consulter les factures de chauffage des deux derniers hivers ?",
      why: "Le DPE est théorique ; les factures révèlent la consommation réelle.",
    },
    {
      category: "Voisinage",
      question: "Comment décririez-vous l'isolation phonique avec les voisins et sur rue ?",
      why: "Première cause de regret post-achat selon les notaires (23 % des cas).",
    },
  ];
  const byType: Record<string, VisitQuestion[]> = {
    maison: [
      {
        category: "Structure",
        question: "La toiture et la charpente ont-elles été révisées ? Y a-t-il eu des traces d'humidité en sous-sol ?",
        why: "Réfection de toiture : 15 à 40 k€, le poste de dépense le plus lourd d'une maison.",
      },
      {
        category: "Terrain",
        question: "Les limites de propriété sont-elles bornées ? Des servitudes de passage existent-elles ?",
        why: "Un bornage contradictoire évite 90 % des litiges de voisinage.",
      },
    ],
    appartement: [
      {
        category: "Copropriété",
        question: "Puis-je consulter les trois derniers procès-verbaux d'assemblée générale ?",
        why: "On y lit les conflits, les impayés et les travaux à venir, bien mieux que dans l'annonce.",
      },
      {
        category: "Immeuble",
        question: "Quel est le taux d'impayés de charges dans la copropriété ?",
        why: "Au-delà de 15 %, la copropriété est considérée comme fragile (registre ANAH).",
      },
    ],
    studio: [
      {
        category: "Location",
        question: "Le règlement de copropriété autorise-t-il la location courte durée ?",
        why: "Certains règlements l'interdisent : décisif pour la rentabilité visée.",
      },
    ],
    loft: [
      {
        category: "Urbanisme",
        question: "Le changement de destination (local d'activité → habitation) est-il régularisé ?",
        why: "Sans régularisation, le bien est invendable en l'état et inassurable en habitation.",
      },
    ],
    immeuble: [
      {
        category: "Locatif",
        question: "Puis-je consulter les baux en cours, les quittances et l'état des impayés ?",
        why: "Les revenus annoncés doivent être vérifiés bail par bail avant toute offre.",
      },
    ],
  };
  return [...(byType[propertyType] ?? byType.appartement), ...common];
}

/* ---------------------- EF-L-08 / EF-I-04 : comparaison multi-biens ---------------------- */

export async function compareProperties(
  ids: string[],
): Promise<ComparisonResult> {
  await delay(2000);
  const props = ids
    .map((id) => getPropertyById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const pricePerSqm = props.map((p) => Math.round(p.price / p.surface));
  const minIdx = (arr: number[]) => arr.indexOf(Math.min(...arr));
  const maxIdx = (arr: number[]) => arr.indexOf(Math.max(...arr));

  return {
    propertyIds: props.map((p) => p.id),
    rows: [
      {
        criterion: "Prix",
        values: props.map((p) =>
          p.transaction === "location"
            ? `${p.price.toLocaleString("fr-FR")} €/mois`
            : `${p.price.toLocaleString("fr-FR")} €`,
        ),
        bestIndex: minIdx(props.map((p) => p.price)),
      },
      {
        criterion: "Prix au m²",
        values: pricePerSqm.map((v) => `${v.toLocaleString("fr-FR")} €/m²`),
        bestIndex: minIdx(pricePerSqm),
      },
      {
        criterion: "Surface",
        values: props.map((p) => `${p.surface} m²`),
        bestIndex: maxIdx(props.map((p) => p.surface)),
      },
      {
        criterion: "Pièces / chambres",
        values: props.map((p) => `${p.rooms} p. / ${p.bedrooms} ch.`),
        bestIndex: maxIdx(props.map((p) => p.rooms)),
      },
      {
        criterion: "Classe énergie",
        values: props.map((p) => p.energyClass),
        bestIndex: minIdx(props.map((p) => p.energyClass.charCodeAt(0))),
      },
      {
        criterion: "Score d'honnêteté",
        values: props.map((p) => `${p.honestyScore}/100`),
        bestIndex: maxIdx(props.map((p) => p.honestyScore)),
      },
      {
        criterion: "Score qualité annonce",
        values: props.map((p) => `${p.qualityScore}/100`),
        bestIndex: maxIdx(props.map((p) => p.qualityScore)),
      },
      {
        criterion: "Écart vs estimation IA",
        values: props.map((p) => {
          const d = Math.round(((p.price - p.aiPriceEstimate) / p.aiPriceEstimate) * 100);
          return `${d > 0 ? "+" : ""}${d} %`;
        }),
        bestIndex: minIdx(
          props.map((p) => Math.abs(p.price - p.aiPriceEstimate) / p.aiPriceEstimate),
        ),
      },
    ],
    pros: props.map((p) => {
      const list = [...p.features.slice(0, 2)];
      if (p.honestyScore >= 85) list.push("Annonce jugée très fiable");
      if (p.price <= p.aiPriceEstimate) list.push("Prix sous l'estimation IA");
      if (p.energyClass <= "C") list.push(`Bonne performance énergétique (${p.energyClass})`);
      return list;
    }),
    cons: props.map((p) => {
      const list: string[] = [];
      if (p.price > p.aiPriceEstimate)
        list.push(`Prix ${Math.round(((p.price - p.aiPriceEstimate) / p.aiPriceEstimate) * 100)} % au-dessus de l'estimation`);
      if (p.energyClass >= "E") list.push(`DPE ${p.energyClass} : travaux énergétiques à prévoir`);
      if (!p.availabilityVerified) list.push("Disponibilité non vérifiée");
      if (p.honestyScore < 75) list.push("Score d'honnêteté moyen : vigilance");
      if (list.length === 0) list.push("Forte demande : décision rapide nécessaire");
      return list;
    }),
    verdict:
      props.length >= 2
        ? `Sur le rapport qualité/prix, « ${props[minIdx(pricePerSqm)].title.split("—")[0].trim()} » se détache : meilleur prix au m² et score de fiabilité de ${props[minIdx(pricePerSqm)].honestyScore}/100. Si votre priorité est la surface ou l'énergie, consultez les lignes correspondantes ci-dessus.`
        : "Sélectionnez au moins deux biens pour obtenir une synthèse comparative.",
  };
}

/* ---------------------- EF-L-13 : plan du bien ---------------------- */

export async function generateFloorPlan(propertyId: string): Promise<{
  rooms: { name: string; area: number; x: number; y: number; w: number; h: number }[];
  totalArea: number;
}> {
  await delay(1600);
  const p = getPropertyById(propertyId);
  const surface = p?.surface ?? 70;
  const scale = surface / 92;
  const layout = [
    { name: "Séjour", area: Math.round(32 * scale), x: 4, y: 4, w: 44, h: 52 },
    { name: "Cuisine", area: Math.round(12 * scale), x: 4, y: 58, w: 26, h: 38 },
    { name: "Chambre 1", area: Math.round(15 * scale), x: 50, y: 4, w: 30, h: 40 },
    { name: "Chambre 2", area: Math.round(12 * scale), x: 50, y: 46, w: 30, h: 34 },
    { name: "SdB", area: Math.round(6 * scale), x: 82, y: 4, w: 14, h: 28 },
    { name: "Entrée", area: Math.round(8 * scale), x: 32, y: 58, w: 16, h: 38 },
    { name: "WC", area: Math.round(2 * scale), x: 82, y: 34, w: 14, h: 16 },
    { name: "Dégag.", area: Math.round(5 * scale), x: 50, y: 82, w: 46, h: 14 },
  ];
  return { rooms: layout, totalArea: surface };
}

/* ---------------------- EF-L-09 : matching colocation ---------------------- */

export { colocProfiles } from "@/data/community";

/* ---------------------- Compteur global pour la home ---------------------- */

export function getPlatformStats() {
  return {
    listings: properties.length * 1247,
    aiAnalyses: 184_520,
    avgSaleDays: 41,
    satisfaction: 4.8,
  };
}
