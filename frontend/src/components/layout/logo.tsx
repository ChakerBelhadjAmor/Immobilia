import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  variant = "dark",
  className,
}: {
  /** dark = navy text (light backgrounds), light = sand text (navy backgrounds) */
  variant?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5", className)}
      aria-label="Immobil'IA — accueil"
    >
      <Image
        src="/brand/logo.png"
        alt=""
        width={40}
        height={31}
        className="h-8 w-auto"
        priority
      />
      <span
        className={cn(
          "font-display text-xl font-semibold tracking-tight",
          variant === "dark" ? "text-navy-900" : "text-sand-100",
        )}
      >
        Immobil&rsquo;<span className="text-gold-500">IA</span>
      </span>
    </Link>
  );
}
