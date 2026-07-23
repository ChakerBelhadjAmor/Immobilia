"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Scroll-triggered fade+rise, used once per landing block. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "dark" | "light";
}) {
  return (
    <Reveal
      className={
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
      }
    >
      <p className="text-xs font-semibold tracking-[0.2em] text-gold-600 uppercase">
        {eyebrow}
      </p>
      <h2
        className={`mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl ${
          tone === "dark" ? "text-navy-900" : "text-sand-50"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            tone === "dark" ? "text-navy-500" : "text-sand-300/80"
          }`}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
