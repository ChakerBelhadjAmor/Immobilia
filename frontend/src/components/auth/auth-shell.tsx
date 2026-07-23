import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Logo variant="dark" />
          <h1 className="mt-8 font-display text-2xl font-semibold text-navy-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-navy-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-navy-500">{footer}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-96 rounded-full bg-gold-500/10 blur-3xl"
        />
        <div className="flex h-full flex-col items-center justify-center px-12 text-center">
          <Image
            src="/brand/logo.png"
            alt=""
            width={220}
            height={169}
            className="opacity-90"
          />
          <p className="mt-8 max-w-sm font-display text-xl leading-snug text-sand-100">
            L&rsquo;immobilier augmenté par l&rsquo;intelligence artificielle.
          </p>
          <p className="mt-3 max-w-xs text-sm text-sand-300/70">
            Prix justes, annonces vérifiées, décisions éclairées.
          </p>
        </div>
      </div>
    </div>
  );
}
