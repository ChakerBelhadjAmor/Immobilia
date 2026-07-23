import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "navy"
  | "gold"
  | "sand"
  | "success"
  | "warning"
  | "danger"
  | "outline";

const badgeVariants: Record<BadgeVariant, string> = {
  navy: "bg-navy-800 text-sand-50",
  gold: "bg-gold-100 text-gold-800",
  sand: "bg-sand-200 text-navy-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  outline: "border border-sand-300 text-navy-600",
};

export function Badge({
  className,
  variant = "sand",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Status chip with a small dot — for listing / offer / report statuses. */
export function StatusChip({
  className,
  tone = "success",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "success" | "warning" | "danger" | "neutral" | "gold";
}) {
  const dot: Record<string, string> = {
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
    neutral: "bg-navy-300",
    gold: "bg-gold-500",
  };
  const bg: Record<string, string> = {
    success: "bg-success-50 text-success-700",
    warning: "bg-warning-50 text-warning-700",
    danger: "bg-danger-50 text-danger-700",
    neutral: "bg-sand-100 text-navy-600",
    gold: "bg-gold-50 text-gold-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        bg[tone],
        className,
      )}
      {...props}
    >
      <span className={cn("size-1.5 rounded-full", dot[tone])} aria-hidden />
      {children}
    </span>
  );
}
