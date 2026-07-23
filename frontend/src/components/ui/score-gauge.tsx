"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Signature Immobil'IA component: gold arc gauge used for every
 * AI-computed score (quality, honesty, risk).
 */
export function ScoreGauge({
  value,
  max = 100,
  label,
  size = 120,
  tone = "auto",
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  /** auto = green/gold/red by ratio; gold = always brand gold */
  tone?: "auto" | "gold";
  className?: string;
}) {
  const ratio = Math.min(value / max, 1);
  const stroke =
    tone === "gold"
      ? "var(--color-gold-500)"
      : ratio >= 0.7
        ? "var(--color-success-500)"
        : ratio >= 0.45
          ? "var(--color-gold-500)"
          : "var(--color-danger-500)";

  const r = 44;
  const circumference = Math.PI * r * 1.5; // 270° arc
  const dash = circumference * ratio;

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      role="img"
      aria-label={`${label ?? "Score"} : ${value} sur ${max}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="-rotate-[135deg]"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--color-sand-200)"
          strokeWidth="7"
          strokeDasharray={`${circumference} ${Math.PI * r * 2}`}
          strokeLinecap="round"
        />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="7"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${Math.PI * r * 2}` }}
          whileInView={{ strokeDasharray: `${dash} ${Math.PI * r * 2}` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-display text-2xl font-semibold text-navy-900">
          {value}
        </span>
        <span className="text-[10px] font-medium tracking-wide text-navy-400 uppercase">
          / {max}
        </span>
      </div>
      {label && (
        <span className="mt-1 text-xs font-medium text-navy-600">{label}</span>
      )}
    </div>
  );
}

/** Compact inline score bar for lists and tables. */
export function ScoreBar({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const ratio = Math.min(value / max, 1);
  const color =
    ratio >= 0.7
      ? "bg-success-500"
      : ratio >= 0.45
        ? "bg-gold-500"
        : "bg-danger-500";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-1.5 w-16 overflow-hidden rounded-full bg-sand-200"
        role="img"
        aria-label={`Score ${value} sur ${max}`}
      >
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="tnum text-xs font-semibold text-navy-700">{value}</span>
    </div>
  );
}
