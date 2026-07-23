"use client";

import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { generateFloorPlan } from "@/services/ai-service";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface PlanData {
  rooms: { name: string; area: number; x: number; y: number; w: number; h: number }[];
  totalArea: number;
}

/** EF-L-13 — AI-generated floor plan rendered as an image-like SVG. */
export function FloorPlanDialog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);

  const openAndLoad = async () => {
    setOpen(true);
    if (!plan) {
      setLoading(true);
      setPlan(await generateFloorPlan(propertyId));
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openAndLoad}>
        <LayoutTemplate className="size-4" aria-hidden />
        Générer le plan
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Plan du bien généré par IA"
        description="Reconstitution schématique à partir des photos et de la description — les cotes sont indicatives."
        size="lg"
      >
        {loading || !plan ? (
          <div className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <p className="text-center text-sm text-navy-500">
              Reconstitution des volumes à partir des photos…
            </p>
          </div>
        ) : (
          <figure>
            <svg
              viewBox="0 0 100 100"
              className="w-full rounded-xl border border-sand-300 bg-sand-50"
              role="img"
              aria-label={`Plan schématique, surface totale ${plan.totalArea} m²`}
            >
              {plan.rooms.map((room) => (
                <g key={room.name}>
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.w}
                    height={room.h}
                    fill="#FFFFFF"
                    stroke="#1F2A44"
                    strokeWidth="0.8"
                  />
                  <text
                    x={room.x + room.w / 2}
                    y={room.y + room.h / 2 - 1.5}
                    textAnchor="middle"
                    fontSize="3.4"
                    fontWeight="600"
                    fill="#1F2A44"
                  >
                    {room.name}
                  </text>
                  <text
                    x={room.x + room.w / 2}
                    y={room.y + room.h / 2 + 3.5}
                    textAnchor="middle"
                    fontSize="2.8"
                    fill="#C6A75E"
                  >
                    {room.area} m²
                  </text>
                </g>
              ))}
            </svg>
            <figcaption className="mt-3 text-center text-xs text-navy-400">
              Surface totale estimée : {plan.totalArea} m² — plan non contractuel
            </figcaption>
          </figure>
        )}
      </Dialog>
    </>
  );
}
