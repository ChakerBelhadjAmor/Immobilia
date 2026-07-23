"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { Reveal } from "./reveal";

const stats = [
  { value: 14964, suffix: "", label: "annonces analysées et scorées" },
  { value: 184520, suffix: "", label: "analyses IA réalisées" },
  { value: 41, suffix: " jours", label: "de délai de vente moyen" },
  { value: 96, suffix: " %", label: "des arnaques détectées avant visite" },
];

function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  return (
    <span ref={ref} className="tnum">
      {value.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="border-y border-gold-500/20 bg-navy-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              <div className="text-center">
                <dd className="font-display text-3xl font-semibold text-gold-400 sm:text-5xl">
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </dd>
                <dt className="mt-3 text-sm text-sand-300/70">{stat.label}</dt>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
