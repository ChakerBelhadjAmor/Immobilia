"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Trophy } from "lucide-react";
import type { Property } from "@/types";
import { simulateYield, computeRisk } from "@/services/investor-service";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { cn, formatPrice } from "@/lib/utils";

export function PortfolioComparator({ properties }: { properties: Property[] }) {
  const [budget, setBudget] = useState(300000);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(properties.slice(0, 4).map((p) => p.id)),
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const analyzed = useMemo(() => {
    return properties
      .filter((p) => selected.has(p.id))
      .map((p) => {
        const y = simulateYield(p.id);
        const r = computeRisk(p.id);
        const price = p.transaction === "location" ? p.price * 240 : p.price;
        const affordable = price <= budget;
        return { property: p, yieldSim: y, risk: r, price, affordable };
      })
      .sort((a, b) => b.yieldSim.netYield - a.yieldSim.netYield);
  }, [properties, selected, budget]);

  const bestAffordable = analyzed.find((a) => a.affordable);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          label="Budget d'investissement (€)"
          type="number"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="max-w-56"
        />
        <div className="flex flex-wrap gap-2">
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                selected.has(p.id)
                  ? "border-navy-800 bg-navy-800 text-sand-50"
                  : "border-sand-300 bg-white text-navy-500 hover:border-navy-400",
              )}
            >
              <Image
                src={p.images[0]}
                alt=""
                width={18}
                height={18}
                className="size-4.5 rounded-full object-cover"
              />
              {p.title.split("—")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {bestAffordable && (
        <div className="flex items-center gap-3 rounded-card border border-gold-300 bg-gold-50 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-navy-950">
            <Trophy className="size-4.5" aria-hidden />
          </span>
          <p className="text-sm text-navy-800">
            Pour un budget de <strong>{formatPrice(budget)}</strong>, le
            meilleur rendement accessible est{" "}
            <strong>{bestAffordable.property.title.split("—")[0].trim()}</strong>{" "}
            avec {bestAffordable.yieldSim.netYield}&nbsp;% net.
          </p>
        </div>
      )}

      <Table>
        <THead>
          <Tr>
            <Th>Bien</Th>
            <Th>Prix</Th>
            <Th>Rendement net</Th>
            <Th>Cash-flow /mois</Th>
            <Th>Risque</Th>
            <Th>Budget</Th>
          </Tr>
        </THead>
        <TBody>
          {analyzed.map(({ property, yieldSim, risk, price, affordable }) => (
            <Tr key={property.id}>
              <Td className="max-w-48 truncate font-medium text-navy-800">
                {property.title}
              </Td>
              <Td className="tnum">{formatPrice(price)}</Td>
              <Td className="tnum font-semibold text-success-700">
                {yieldSim.netYield}%
              </Td>
              <Td
                className={cn(
                  "tnum",
                  yieldSim.cashflow >= 0 ? "text-success-700" : "text-danger-600",
                )}
              >
                {yieldSim.cashflow >= 0 ? "+" : ""}
                {yieldSim.cashflow} €
              </Td>
              <Td>
                <Badge
                  variant={
                    risk.score < 35 ? "success" : risk.score < 60 ? "warning" : "danger"
                  }
                >
                  {risk.score}/100
                </Badge>
              </Td>
              <Td>
                {affordable ? (
                  <Badge variant="success">Accessible</Badge>
                ) : (
                  <Badge variant="sand">Hors budget</Badge>
                )}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
