"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

/** EF-T-03 — before/after comparison slider for home staging. */
export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Avant",
  afterLabel = "Après",
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const [position, setPosition] = useState(50);
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[16/10] w-full touch-none overflow-hidden rounded-card border border-sand-200 select-none"
      onMouseMove={(e) => {
        if (e.buttons === 1) updateFromClientX(e.clientX);
      }}
      onTouchMove={(e) => updateFromClientX(e.touches[0].clientX)}
    >
      <Image src={afterUrl} alt={afterLabel} fill className="object-cover" sizes="600px" />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <div className="relative h-full" style={{ width }}>
          <Image
            src={beforeUrl}
            alt={beforeLabel}
            fill
            className="object-cover"
            sizes="600px"
          />
        </div>
      </div>

      <span className="absolute top-3 left-3 rounded-full bg-navy-950/80 px-2.5 py-1 text-[11px] font-semibold text-sand-100 backdrop-blur">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 rounded-full bg-gold-500/90 px-2.5 py-1 text-[11px] font-semibold text-navy-950 backdrop-blur">
        {afterLabel}
      </span>

      <div
        className="absolute inset-y-0 flex w-0.5 -translate-x-1/2 items-center justify-center bg-white/90"
        style={{ left: `${position}%` }}
      >
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label="Position du curseur avant / après"
          className="absolute h-full w-40 -translate-x-1/2 cursor-ew-resize opacity-0"
        />
        <span className="pointer-events-none flex size-9 items-center justify-center rounded-full bg-white text-navy-700 shadow-modal">
          <MoveHorizontal className="size-4" aria-hidden />
        </span>
      </div>
    </div>
  );
}
