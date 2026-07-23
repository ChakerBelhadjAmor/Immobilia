"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export function Tabs({
  items,
  defaultTab,
  className,
}: {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? items[0]?.id);
  const activeItem = items.find((i) => i.id === active);

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-sand-200"
      >
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={active === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => setActive(item.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active === item.id
                ? "text-navy-900"
                : "text-navy-400 hover:text-navy-600",
            )}
          >
            {item.icon}
            {item.label}
            {active === item.id && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold-500"
              />
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${active}`}
        className="pt-5"
      >
        {activeItem?.content}
      </div>
    </div>
  );
}
