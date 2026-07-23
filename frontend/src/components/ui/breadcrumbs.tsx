import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && (
              <ChevronRight className="size-3.5 text-navy-300" aria-hidden />
            )}
            {item.href && !last ? (
              <Link
                href={item.href}
                className="text-navy-400 transition-colors hover:text-navy-700"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className="font-medium text-navy-800"
                aria-current={last ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
