"use client";

import { useState } from "react";
import { FileCheck2, ScrollText, ShieldAlert } from "lucide-react";
import type { GeneratedContract } from "@/types";
import { generateContract } from "@/services/ai-service";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";

/**
 * EF-V-08 / EF-L-06 — regulations + compliant contract generation,
 * with optional verification of the counterparty's contract.
 */
export function ContractDialog({
  transaction,
  city,
  verify = false,
  triggerLabel,
}: {
  transaction: "vente" | "location";
  city: string;
  /** true = also verify the owner's contract (buyer/tenant side) */
  verify?: boolean;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [loading, setLoading] = useState(false);

  const openAndLoad = async () => {
    setOpen(true);
    if (!contract) {
      setLoading(true);
      setContract(await generateContract({ transaction, city, verify }));
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openAndLoad}>
        <ScrollText className="size-4" aria-hidden />
        {triggerLabel ?? "Réglementations & contrat"}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Réglementations & contrat conforme"
        description="Généré selon la loi française — à faire relire par un professionnel pour les cas particuliers."
        size="xl"
      >
        {loading || !contract ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <p className="text-center text-sm text-navy-500">
              Analyse des réglementations applicables et rédaction du contrat…
            </p>
          </div>
        ) : (
          <Tabs
            items={[
              {
                id: "reglementations",
                label: "Réglementations applicables",
                content: (
                  <ul className="space-y-3">
                    {contract.regulations.map((reg) => (
                      <li
                        key={reg.title}
                        className="rounded-xl border border-sand-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-navy-900">
                            {reg.title}
                          </h3>
                          <Badge variant={reg.mandatory ? "danger" : "sand"}>
                            {reg.mandatory ? "Obligatoire" : "Recommandé"}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-navy-500">
                          {reg.description}
                        </p>
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                id: "contrat",
                label: "Contrat type",
                content: (
                  <article>
                    <header className="rounded-xl bg-navy-950 p-5 text-center">
                      <p className="text-xs tracking-widest text-gold-400 uppercase">
                        Réf. {contract.reference}
                      </p>
                      <h3 className="mt-1.5 font-display text-lg font-semibold text-sand-50">
                        {contract.title}
                      </h3>
                    </header>
                    <div className="mt-4 space-y-4">
                      {contract.sections.map((section) => (
                        <section key={section.title}>
                          <h4 className="text-sm font-semibold text-navy-900">
                            {section.title}
                          </h4>
                          <p className="mt-1 text-sm leading-relaxed text-navy-600">
                            {section.content}
                          </p>
                        </section>
                      ))}
                    </div>
                  </article>
                ),
              },
              ...(verify
                ? [
                    {
                      id: "verification",
                      label: "Vérification du contrat reçu",
                      content: (
                        <div>
                          <div className="flex items-center gap-2.5 rounded-lg bg-warning-50 p-3.5 text-sm font-medium text-warning-700">
                            <ShieldAlert className="size-5 shrink-0" aria-hidden />
                            {contract.verificationIssues?.length ?? 0} clause(s) non
                            conforme(s) détectée(s) dans le contrat transmis par le
                            propriétaire.
                          </div>
                          <ul className="mt-4 space-y-3">
                            {contract.verificationIssues?.map((issue) => (
                              <li
                                key={issue}
                                className="flex gap-3 rounded-xl border border-warning-500/30 p-4 text-sm leading-relaxed text-navy-700"
                              >
                                <FileCheck2
                                  className="size-4.5 shrink-0 text-warning-600"
                                  aria-hidden
                                />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Dialog>
    </>
  );
}
