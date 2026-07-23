import type { Metadata } from "next";
import { stagingExamples } from "@/data/tools";
import { BeforeAfterSlider } from "@/components/tools/before-after-slider";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, Wallet } from "lucide-react";

export const metadata: Metadata = {
  title: "Home staging avant/après",
  description:
    "Visualisez le potentiel d'un bien avec le mode avant/après, pour convaincre un vendeur de réaliser du home staging.",
};

export default function HomeStagingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Home staging : avant / après
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          Faites glisser le curseur pour visualiser l&rsquo;impact du home
          staging — un argument concret pour convaincre un vendeur d&rsquo;y
          investir avant la mise en ligne.
        </p>
      </header>

      <div className="mt-8 grid gap-8">
        {stagingExamples.map((example) => (
          <div
            key={example.id}
            className="grid gap-5 rounded-card border border-sand-200 bg-white p-5 shadow-card lg:grid-cols-[1.6fr_1fr] lg:p-6"
          >
            <BeforeAfterSlider beforeUrl={example.beforeUrl} afterUrl={example.afterUrl} />
            <div className="flex flex-col justify-center">
              <h2 className="font-display text-lg font-semibold text-navy-900">
                {example.title}
              </h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-sand-50 p-3.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-navy-800 text-gold-400">
                    <Wallet className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="tnum text-sm font-semibold text-navy-900">
                      {formatPrice(example.costEstimate)}
                    </p>
                    <p className="text-xs text-navy-400">Coût du home staging</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-success-50 p-3.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-success-500 text-white">
                    <TrendingUp className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="tnum text-sm font-semibold text-success-700">
                      +{formatPrice(example.valueGain)}
                    </p>
                    <p className="text-xs text-success-600/80">
                      Valorisation estimée à la vente
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
