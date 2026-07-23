import type { Metadata } from "next";
import { properties } from "@/data/properties";
import { getPortfolioStats } from "@/services/investor-service";
import { StatCard } from "@/components/dashboard/stat-card";
import { Landmark, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import { InvestorPropertyList } from "@/components/investor/investor-property-list";
import { PortfolioComparator } from "@/components/investor/portfolio-comparator";

export const metadata: Metadata = {
  title: "Espace investisseur",
  description:
    "Tableau de bord investisseur : rendement, risque locatif, prévision de plus-value et comparateur multi-biens pour votre portefeuille.",
};

const statIcons = [Wallet, TrendingUp, PiggyBank, Landmark];

export default async function InvestorDashboardPage() {
  const stats = await getPortfolioStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Tableau de bord investisseur
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-navy-500">
          Rendement, risque et perspective de plus-value pour chaque bien —
          générez un rapport complet ou comparez plusieurs biens pour
          orienter votre allocation.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            icon={statIcons[i]}
            label={stat.label}
            value={stat.value}
            change={stat.change}
            tone={i === 1 ? "gold" : "neutral"}
          />
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-navy-900">
          Biens à analyser
        </h2>
        <p className="mt-1 text-sm text-navy-500">
          Générez un rapport d&rsquo;investissement personnalisé pour
          n&rsquo;importe quel bien de la plateforme.
        </p>
        <div className="mt-5">
          <InvestorPropertyList properties={properties} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-navy-900">
          Comparateur de portefeuille
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-navy-500">
          Sélectionnez plusieurs biens pour identifier le meilleur rendement
          selon votre budget d&rsquo;investissement.
        </p>
        <div className="mt-5">
          <PortfolioComparator properties={properties} />
        </div>
      </section>
    </div>
  );
}
