"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const reportSchema = z.object({
  kind: z.enum(["scam", "comportement"]),
  reason: z
    .string()
    .min(20, "Décrivez le problème en au moins 20 caractères pour que l'équipe puisse agir."),
});

type ReportForm = z.infer<typeof reportSchema>;

/** EF-L-12 — report a scam or inappropriate owner behaviour. */
export function ReportDialog({ propertyTitle }: { propertyTitle: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: { kind: "scam", reason: "" },
  });
  const kind = watch("kind");

  const onSubmit = async (data: ReportForm) => {
    await new Promise((r) => setTimeout(r, 900));
    setOpen(false);
    reset();
    toast({
      variant: "success",
      title: "Signalement envoyé",
      description: `Merci. Notre équipe de modération examine chaque signalement sous 24 h (${data.kind === "scam" ? "suspicion d'arnaque" : "comportement inadéquat"}).`,
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-400 transition-colors hover:text-danger-600"
      >
        <Flag className="size-3.5" aria-hidden />
        Signaler cette annonce
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Signaler un problème"
        description={propertyTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              loading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              Envoyer le signalement
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <fieldset>
            <legend className="text-sm font-medium text-navy-800">
              Nature du problème
            </legend>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: "scam",
                    title: "Arnaque suspectée",
                    text: "Bien fictif, déjà loué, demande de paiement anticipé…",
                  },
                  {
                    value: "comportement",
                    title: "Comportement inadéquat",
                    text: "Propos discriminatoires, harcèlement, pratiques illégales…",
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition-colors",
                    kind === opt.value
                      ? "border-danger-500 bg-danger-50"
                      : "border-sand-300 hover:border-navy-300",
                  )}
                >
                  <input
                    type="radio"
                    value={opt.value}
                    checked={kind === opt.value}
                    onChange={() => setValue("kind", opt.value)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-navy-900">
                    {opt.title}
                  </span>
                  <span className="mt-1 block text-xs text-navy-500">
                    {opt.text}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Textarea
            label="Décrivez les faits"
            placeholder="Le propriétaire m'a demandé un virement avant toute visite…"
            error={errors.reason?.message}
            {...register("reason")}
          />
        </form>
      </Dialog>
    </>
  );
}
