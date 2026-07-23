import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function PropertyNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <EmptyState
        icon={<SearchX className="size-6" aria-hidden />}
        title="Ce bien n'existe plus"
        description="L'annonce a peut-être été retirée ou vendue. Relancez une recherche pour découvrir des biens similaires."
        action={
          <Link href="/recherche">
            <Button tabIndex={-1}>Retour à la recherche</Button>
          </Link>
        }
      />
    </div>
  );
}
