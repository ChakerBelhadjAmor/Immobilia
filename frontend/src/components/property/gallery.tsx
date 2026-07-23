"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import type { Property } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

/** Image gallery with AI virtual-tour entry point (EF-V-06). */
export function Gallery({ property }: { property: Property }) {
  const [active, setActive] = useState(0);
  const { toast } = useToast();

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-sand-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={property.images[active]}
              alt={`${property.title} — photo ${active + 1} sur ${property.images.length}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
        {property.virtualTourUrl && (
          <button
            onClick={() =>
              toast({
                variant: "info",
                title: "Visite virtuelle IA",
                description:
                  "La visite virtuelle générée à partir des photos et vidéos du vendeur s'ouvrirait ici (démo).",
              })
            }
            className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-navy-950/85 px-4 py-2 text-sm font-medium text-sand-50 backdrop-blur transition-colors hover:bg-navy-950"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-gold-500 text-navy-950">
              <Play className="size-3 fill-current" aria-hidden />
            </span>
            Visite virtuelle générée par IA
          </button>
        )}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-3">
        {property.images.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            aria-label={`Voir la photo ${i + 1}`}
            aria-current={active === i}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-lg transition-all",
              active === i
                ? "ring-2 ring-gold-500 ring-offset-2 ring-offset-sand-50"
                : "opacity-75 hover:opacity-100",
            )}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="150px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
