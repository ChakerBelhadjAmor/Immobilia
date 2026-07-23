/* ------------------------------------------------------------------
   Investor service — mock implementation (EF-I-01 → EF-I-06).
------------------------------------------------------------------ */

import { delay } from "@/lib/utils";
import { getPropertyById } from "@/data/properties";
import { getNeighborhoodById } from "@/data/neighborhoods";
import type {
  InvestmentReport,
  PortfolioStat,
  RiskScore,
  WhatIfScenario,
  YieldSimulation,
} from "@/types";

/** Typical gross rental yield (%/year) by city, before type/DPE adjustment. */
const cityBaseYield = (city: string): number => {
  if (city.includes("Paris")) return 3.4;
  if (city.includes("Lyon")) return 4.3;
  if (city.includes("Bordeaux")) return 4.6;
  if (city.includes("Marseille")) return 5.1;
  if (city.includes("Nantes")) return 4.8;
  if (city.includes("Lille")) return 5.6;
  return 4.7;
};

const typeYieldAdjustment: Record<string, number> = {
  studio: 1.1,
  appartement: 0,
  duplex: -0.2,
  loft: -0.3,
  maison: -0.4,
  immeuble: 0.9,
};

function simulateYield(propertyId: string): YieldSimulation {
  const p = getPropertyById(propertyId);
  if (!p) throw new Error(`Bien introuvable : ${propertyId}`);
  const price = p.transaction === "location" ? p.price * 240 : p.price;
  const dpePenalty = p.energyClass >= "E" ? -0.4 : p.energyClass <= "B" ? 0.2 : 0;
  const targetGrossYield =
    p.transaction === "location"
      ? ((p.price * 12) / price) * 100
      : cityBaseYield(p.city) + typeYieldAdjustment[p.type] + dpePenalty;
  const annualRent =
    p.transaction === "location" ? p.price * 12 : Math.round((price * targetGrossYield) / 100);
  const monthlyRent = Math.round(annualRent / 12);
  const annualCosts = Math.round(annualRent * 0.24);
  const grossYield = (annualRent / price) * 100;
  const netYield = ((annualRent - annualCosts) / (price * 1.08)) * 100;
  const monthlyLoan = Math.round((price * 0.8 * 0.0052));
  return {
    grossYield: Math.round(grossYield * 10) / 10,
    netYield: Math.round(netYield * 10) / 10,
    monthlyRent,
    annualCosts,
    cashflow: monthlyRent - Math.round(annualCosts / 12) - monthlyLoan,
    paybackYears: Math.round((price / (annualRent - annualCosts)) * 10) / 10,
  };
}

function computeRisk(propertyId: string): RiskScore {
  const p = getPropertyById(propertyId);
  const n = p ? getNeighborhoodById(p.neighborhoodId) : undefined;
  const zoneTendue = ["Paris 17e", "Lyon 4e", "Bordeaux"].some((c) =>
    p?.city.includes(c.split(" ")[0]),
  );
  const secure = (n?.score.securite ?? 60) >= 70;
  const base = 30 + (secure ? -8 : 12) + (zoneTendue ? -10 : 8) + ((p?.energyClass ?? "D") >= "E" ? 14 : 0);
  return {
    score: Math.max(8, Math.min(base, 88)),
    factors: [
      {
        label: "Zone tendue",
        level: zoneTendue ? "faible" : "modere",
        detail: zoneTendue
          ? "Marché locatif tendu : demande structurellement supérieure à l'offre, vacance quasi nulle."
          : "Zone détendue : prévoir 3 à 5 semaines de vacance entre deux locataires.",
      },
      {
        label: "Vacance locative moyenne",
        level: zoneTendue ? "faible" : "modere",
        detail: zoneTendue
          ? "12 jours/an observés sur le secteur (source : observatoire local des loyers)."
          : "28 jours/an observés sur le secteur.",
      },
      {
        label: "Profil des locataires types",
        level: secure ? "faible" : "modere",
        detail: secure
          ? "Jeunes actifs CSP+ et familles : taux d'impayés inférieur à 1,4 %."
          : "Population étudiante majoritaire : rotation élevée, privilégier la caution Visale.",
      },
      {
        label: "Contrainte énergétique",
        level: (p?.energyClass ?? "D") >= "E" ? "eleve" : "faible",
        detail:
          (p?.energyClass ?? "D") >= "E"
            ? `DPE ${p?.energyClass} : interdiction de louer à horizon 2028 (loi Climat), budget rénovation à provisionner.`
            : `DPE ${p?.energyClass} : aucune contrainte réglementaire à 10 ans.`,
      },
    ],
  };
}

function forecast(propertyId: string) {
  const p = getPropertyById(propertyId);
  const n = p ? getNeighborhoodById(p.neighborhoodId) : undefined;
  const price = p?.transaction === "location" ? (p?.price ?? 0) * 240 : (p?.price ?? 0);
  const growth = n?.trend === "hausse" ? 3.4 : n?.trend === "stable" ? 1.6 : 0.4;
  return {
    now: price,
    in5Years: Math.round(price * Math.pow(1 + growth / 100, 5)),
    in10Years: Math.round(price * Math.pow(1 + growth / 100, 10)),
    annualGrowthPercent: growth,
    neighborhoodTrend:
      n?.trend === "hausse"
        ? `${n.name} est en phase de valorisation : +${growth} %/an projeté sur la base des transactions des 24 derniers mois et des projets urbains en cours.`
        : `${n?.name ?? "Le quartier"} affiche une tendance ${n?.trend ?? "stable"} : croissance prudente estimée à ${growth} %/an.`,
  };
}

/** POST /api/investor/report — EF-I-01 */
export async function generateReport(propertyId: string): Promise<InvestmentReport> {
  await delay(2200);
  const y = simulateYield(propertyId);
  const r = computeRisk(propertyId);
  const f = forecast(propertyId);
  const p = getPropertyById(propertyId);
  return {
    propertyId,
    generatedAt: new Date().toISOString(),
    yieldSimulation: y,
    riskScore: r,
    forecast: f,
    scenarios: await getScenarios(propertyId),
    summary: `${p?.title ?? "Ce bien"} présente un rendement net estimé à ${y.netYield} % pour un risque locatif de ${r.score}/100 (${r.score < 35 ? "faible" : r.score < 60 ? "modéré" : "élevé"}). ${f.neighborhoodTrend} Horizon de récupération du capital : ${y.paybackYears} ans hors levier fiscal.`,
  };
}

/** POST /api/investor/scenarios — EF-I-02 */
export async function getScenarios(propertyId: string): Promise<WhatIfScenario[]> {
  await delay(400);
  const p = getPropertyById(propertyId);
  const price = p?.transaction === "location" ? (p?.price ?? 0) * 240 : (p?.price ?? 0);
  return [
    {
      id: "sc-travaux",
      label: "Et si je rénove ? (cuisine + SdB, 25 k€)",
      description:
        "Rénovation complète cuisine et salle de bains : loyer réévalué de +11 %, DPE amélioré d'une classe.",
      deltaYield: 0.7,
      deltaValue: Math.round(price * 0.06),
    },
    {
      id: "sc-quartier",
      label: "Et si le quartier évolue ? (ligne de tram 2028)",
      description:
        "La mise en service annoncée de la nouvelle ligne réduit le temps de trajet centre-ville de 12 min : effet observé ailleurs de +8 % sur les prix en 3 ans.",
      deltaYield: 0.2,
      deltaValue: Math.round(price * 0.08),
    },
    {
      id: "sc-taux",
      label: "Et si les taux montent ? (+100 pdb)",
      description:
        "Un passage de 3,6 % à 4,6 % renchérit la mensualité de 11 % et comprime le cash-flow ; le pouvoir d'achat des acquéreurs baisse, pesant sur la revente à court terme.",
      deltaYield: -0.5,
      deltaValue: -Math.round(price * 0.05),
    },
    {
      id: "sc-taux-baisse",
      label: "Et si les taux baissent ? (−80 pdb)",
      description:
        "Renégociation du crédit possible : cash-flow mensuel amélioré et demande acquéreuse stimulée sur le segment.",
      deltaYield: 0.4,
      deltaValue: Math.round(price * 0.04),
    },
  ];
}

/** GET /api/investor/portfolio-stats — EF-I-06 */
export async function getPortfolioStats(): Promise<PortfolioStat[]> {
  await delay(500);
  return [
    { label: "Valeur du portefeuille", value: "1,24 M€", change: 4.2 },
    { label: "Rendement net moyen", value: "5,3 %", change: 0.3 },
    { label: "Cash-flow mensuel", value: "+1 840 €", change: 6.1 },
    { label: "Taux d'occupation", value: "97 %", change: 1.5 },
  ];
}

export { simulateYield, computeRisk, forecast };
