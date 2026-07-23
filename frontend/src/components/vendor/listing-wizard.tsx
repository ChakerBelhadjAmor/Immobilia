"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { emptyDraft, wizardSteps, type ListingDraft } from "./wizard-types";
import { StepHeader } from "./step-header";
import { StepBasics } from "./step-basics";
import { StepDescription } from "./step-description";
import { StepPricing } from "./step-pricing";
import { StepCompetition } from "./step-competition";
import { StepQuality } from "./step-quality";
import { StepCompliance } from "./step-compliance";
import { StepPublish } from "./step-publish";
import { Button } from "@/components/ui/button";

const requiredByStep = (draft: ListingDraft, step: number) => {
  if (step === 0) return Boolean(draft.title && draft.city && draft.photoCount >= 1);
  if (step === 1) return draft.description.length >= 20;
  return true;
};

export function ListingWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);

  const patch = (p: Partial<ListingDraft>) => setDraft((d) => ({ ...d, ...p }));
  const canNext = requiredByStep(draft, step);
  const isLast = step === wizardSteps.length - 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          Déposer une annonce
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          L&rsquo;IA vous accompagne à chaque étape : prix, conformité,
          qualité de l&rsquo;annonce.
        </p>
      </header>

      <div className="mt-6">
        <StepHeader current={step} />
      </div>

      <div className="mt-8 rounded-card border border-sand-200 bg-sand-50/60 p-5 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="mb-5 font-display text-lg font-semibold text-navy-900">
              {wizardSteps[step]}
            </h2>
            {step === 0 && <StepBasics draft={draft} onChange={patch} />}
            {step === 1 && <StepDescription draft={draft} onChange={patch} />}
            {step === 2 && <StepPricing draft={draft} onChange={patch} />}
            {step === 3 && <StepCompetition draft={draft} />}
            {step === 4 && <StepQuality draft={draft} />}
            {step === 5 && <StepCompliance draft={draft} />}
            {step === 6 && <StepPublish draft={draft} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {!isLast && (
        <div className="mt-6 flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Précédent
          </Button>
          <Button
            onClick={() => setStep((s) => Math.min(wizardSteps.length - 1, s + 1))}
            disabled={!canNext}
          >
            Suivant
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
