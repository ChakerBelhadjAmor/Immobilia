import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-sand-300 bg-sand-50/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-gold-100 text-gold-700">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-navy-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
