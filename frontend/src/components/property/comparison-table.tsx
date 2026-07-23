import { CheckCircle2, Minus, X } from "lucide-react";
import type { ComparisonResult, Property } from "@/types";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ComparisonTable({
  properties,
  result,
}: {
  properties: Property[];
  result: ComparisonResult;
}) {
  return (
    <div className="space-y-6">
      <Table>
        <THead>
          <Tr>
            <Th>Critère</Th>
            {properties.map((p) => (
              <Th key={p.id} className="min-w-40">
                {p.title.split("—")[0].trim()}
              </Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {result.rows.map((row) => (
            <Tr key={row.criterion}>
              <Td className="font-medium text-navy-600">{row.criterion}</Td>
              {row.values.map((value, i) => (
                <Td
                  key={i}
                  className={cn(
                    "tnum",
                    row.bestIndex === i &&
                      "font-semibold text-success-700 bg-success-50/60",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {row.bestIndex === i && (
                      <CheckCircle2 className="size-3.5" aria-hidden />
                    )}
                    {value}
                  </span>
                </Td>
              ))}
            </Tr>
          ))}
        </TBody>
      </Table>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${properties.length}, minmax(0, 1fr))`,
        }}
      >
        {properties.map((p, i) => (
          <div
            key={p.id}
            className="rounded-card border border-sand-200 bg-white p-4"
          >
            <h4 className="text-sm font-semibold text-navy-900">
              {p.title.split("—")[0].trim()}
            </h4>
            <ul className="mt-3 space-y-1.5">
              {result.pros[i]?.map((pro) => (
                <li
                  key={pro}
                  className="flex items-start gap-1.5 text-xs text-success-700"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {pro}
                </li>
              ))}
              {result.cons[i]?.map((con) => (
                <li
                  key={con}
                  className="flex items-start gap-1.5 text-xs text-danger-600"
                >
                  <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex gap-3 rounded-card border border-gold-300 bg-gold-50 p-4">
        <Minus className="mt-0.5 size-4 shrink-0 rotate-90 text-gold-700" aria-hidden />
        <p className="text-sm leading-relaxed text-navy-700">
          <strong className="font-semibold">Synthèse IA — </strong>
          {result.verdict}
        </p>
      </div>
    </div>
  );
}
