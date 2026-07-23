import { Check } from "lucide-react";
import { wizardSteps } from "./wizard-types";
import { cn } from "@/lib/utils";

export function StepHeader({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1">
      {wizardSteps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step} className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-navy-800 text-sand-50"
                  : done
                    ? "bg-success-50 text-success-700"
                    : "bg-sand-100 text-navy-400",
              )}
            >
              <span
                className={cn(
                  "flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold",
                  active
                    ? "bg-gold-500 text-navy-950"
                    : done
                      ? "bg-success-500 text-white"
                      : "bg-sand-300 text-navy-500",
                )}
              >
                {done ? <Check className="size-3" aria-hidden /> : i + 1}
              </span>
              {step}
            </span>
            {i < wizardSteps.length - 1 && (
              <span className="h-px w-3 bg-sand-300" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
