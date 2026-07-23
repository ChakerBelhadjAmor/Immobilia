import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Gauge, PiggyBank, TrendingUp } from "lucide-react";
import { getPropertyById, properties } from "@/data/properties";
import { generateReport } from "@/services/investor-service";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { WhatIfScenarios } from "@/components/investor/what-if-scenarios";
import { CapitalGainChart } from "@/components/investor/capital-gain-chart";
import { formatPrice, formatSurface } from "@/lib/utils";

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const p = getPropertyById(id);
  return { title: p ? `Rapport d'investissement — ${p.title}` : "Rapport introuvable" };
}

const riskTone = (level: "faible" | "modere" | "eleve") =>
  level === "faible" ? "success" : level === "modere" ? "warning" : "danger";

export default async function InvestmentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getPropertyById(id);
  if (!property) notFound();

  const report = await generateReport(id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Espace investisseur", href: "/espace/investisseur" },
          { label: "Rapport" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Image
          src={property.images[0]}
          alt=""
          width={72}
          height={72}
          className="size-18 rounded-xl object-cover"
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-navy-400 uppercase">
            Rapport d&rsquo;investissement personnalisé
          </p>
          <h1 className="font-display text-xl font-semibold text-navy-900 sm:text-2xl">
            {property.title}
          </h1>
          <p className="mt-0.5 text-sm text-navy-500">
            {property.city} · {formatSurface(property.surface)} ·{" "}
            {formatPrice(property.price)}
          </p>
        </div>
      </div>

      {/* Résumé */}
      <div className="mt-6 rounded-card border border-gold-300 bg-gold-50 p-5">
        <p className="text-sm leading-relaxed text-navy-800">{report.summary}</p>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-3">
        {/* Simulation de rentabilité — EF-I-01 */}
        <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <PiggyBank className="size-4 text-gold-600" aria-hidden />
            Simulation de rentabilité locative
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Rendement brut", value: `${report.yieldSimulation.grossYield}%` },
              { label: "Rendement net", value: `${report.yieldSimulation.netYield}%` },
              {
                label: "Cash-flow mensuel",
                value: `${report.yieldSimulation.cashflow >= 0 ? "+" : ""}${report.yieldSimulation.cashflow} €`,
              },
              {
                label: "Retour sur capital",
                value: `${report.yieldSimulation.paybackYears} ans`,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-sand-50 p-3.5 text-center">
                <p className="tnum font-display text-lg font-semibold text-navy-900">
                  {item.value}
                </p>
                <p className="mt-1 text-[11px] text-navy-400">{item.label}</p>
              </div>
            ))}
          </div>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-navy-500">
            <div className="flex gap-1">
              <dt className="font-medium">Loyer mensuel estimé :</dt>
              <dd className="tnum">{formatPrice(report.yieldSimulation.monthlyRent)}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-medium">Charges annuelles :</dt>
              <dd className="tnum">{formatPrice(report.yieldSimulation.annualCosts)}</dd>
            </div>
          </dl>
        </div>

        {/* Score de risque — EF-I-03 */}
        <div className="rounded-card border border-sand-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Gauge className="size-4 text-gold-600" aria-hidden />
            Score de risque locatif
          </h2>
          <div className="mt-3 flex justify-center">
            <ScoreGauge value={report.riskScore.score} label="Risque" size={110} />
          </div>
          <ul className="mt-4 space-y-2.5">
            {report.riskScore.factors.map((f) => (
              <li key={f.label} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-navy-700">{f.label}</span>
                  <Badge variant={riskTone(f.level)} className="text-[10px]">
                    {f.level}
                  </Badge>
                </div>
                <p className="mt-0.5 leading-relaxed text-navy-400">{f.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Prévision de plus-value — EF-I-05 */}
      <section className="mt-8 rounded-card border border-sand-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-navy-900">
          <TrendingUp className="size-4 text-gold-600" aria-hidden />
          Prévision de plus-value à 5 et 10 ans
        </h2>
        <div className="mt-5">
          <CapitalGainChart forecast={report.forecast} />
        </div>
      </section>

      {/* Scénarios "et si" — EF-I-02 */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-navy-900">
          Scénarios «&nbsp;et si&nbsp;»
        </h2>
        <p className="mt-1 text-sm text-navy-500">
          Activez un ou plusieurs scénarios pour mesurer leur impact combiné
          sur le rendement et la valeur du bien.
        </p>
        <div className="mt-5">
          <WhatIfScenarios
            scenarios={report.scenarios}
            baseYield={report.yieldSimulation.netYield}
            baseValue={report.forecast.now}
          />
        </div>
      </section>
    </div>
  );
}
