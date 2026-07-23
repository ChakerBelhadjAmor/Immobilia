"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, Loader2, ScrollText, ShieldCheck } from "lucide-react";
import type { FraudAlert, GeneratedContract } from "@/types";
import type { ListingDraft } from "./wizard-types";
import { detectFraud, generateContract } from "@/services/ai-service";
import { Badge } from "@/components/ui/badge";

/** EF-V-08 (regulations + contract) + EF-V-09 (fraud/discrimination alerts). */
export function StepCompliance({ draft }: { draft: ListingDraft }) {
  const [alerts, setAlerts] = useState<FraudAlert[] | null>(null);
  const [contract, setContract] = useState<GeneratedContract | null>(null);

  useEffect(() => {
    detectFraud(draft.description).then(setAlerts);
    generateContract({ transaction: draft.transaction, city: draft.city || "France" }).then(
      setContract,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-sand-200 bg-white p-5">
        <div className="flex gap-3">
          <span
            className={
              "flex size-10 shrink-0 items-center justify-center rounded-xl " +
              (alerts && alerts.length > 0
                ? "bg-danger-500 text-white"
                : "bg-success-500 text-white")
            }
          >
            {alerts && alerts.length > 0 ? (
              <AlertOctagon className="size-5" aria-hidden />
            ) : (
              <ShieldCheck className="size-5" aria-hidden />
            )}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-navy-900">
              Détection anti-discrimination & anti-fraude
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-navy-500">
              Analyse automatique des formulations illégales ou
              discriminatoires dans votre description.
            </p>
          </div>
        </div>

        {!alerts ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-sand-100 p-4 text-sm text-navy-600">
            <Loader2 className="size-4 animate-spin text-gold-600" aria-hidden />
            Analyse du texte en cours…
          </div>
        ) : alerts.length === 0 ? (
          <div className="mt-4 rounded-lg bg-success-50 p-3.5 text-sm text-success-700">
            Aucune formulation discriminatoire ou illégale détectée.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {alerts.map((alert, i) => (
              <li key={i} className="rounded-lg border border-danger-500/30 bg-danger-50 p-3.5">
                <p className="text-sm font-medium text-danger-700">
                  « {alert.excerpt} »
                </p>
                <p className="mt-1 text-xs text-danger-600">{alert.reason}</p>
                {alert.law && (
                  <p className="mt-1 text-[11px] text-danger-500/80">{alert.law}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-card border border-sand-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-gold-400">
            <ScrollText className="size-5" aria-hidden />
          </span>
          <h3 className="text-sm font-semibold text-navy-900">
            Réglementations & contrat générés
          </h3>
        </div>
        {!contract ? (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-sand-100 p-4 text-sm text-navy-600">
            <Loader2 className="size-4 animate-spin text-gold-600" aria-hidden />
            Génération du contrat conforme…
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-navy-800">{contract.title}</p>
            <ul className="space-y-2">
              {contract.regulations.map((reg) => (
                <li key={reg.title} className="flex items-start gap-2.5 text-sm">
                  <Badge variant={reg.mandatory ? "danger" : "sand"} className="mt-0.5 shrink-0">
                    {reg.mandatory ? "Obligatoire" : "Recommandé"}
                  </Badge>
                  <span className="text-navy-600">
                    <strong className="font-medium text-navy-800">{reg.title} — </strong>
                    {reg.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
