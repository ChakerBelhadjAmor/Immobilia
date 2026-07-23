import Link from "next/link";
import { Logo } from "./logo";

const columns = [
  {
    title: "Plateforme",
    links: [
      { label: "Rechercher un bien", href: "/recherche" },
      { label: "Carte des offres", href: "/carte" },
      { label: "Comparer des biens", href: "/comparer" },
      { label: "Colocation", href: "/colocation" },
    ],
  },
  {
    title: "Espaces",
    links: [
      { label: "Vendeur / Bailleur", href: "/espace/vendeur" },
      { label: "Investisseur", href: "/espace/investisseur" },
      { label: "Mes favoris", href: "/favoris" },
      { label: "Messages", href: "/messages" },
    ],
  },
  {
    title: "Outils IA",
    links: [
      { label: "Idées de décoration", href: "/outils/decoration" },
      { label: "Home staging avant/après", href: "/outils/home-staging" },
      { label: "Estimation de réparations", href: "/outils/reparations" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Guide du vendeur", href: "/#faq" },
      { label: "Réglementations", href: "/#faq" },
      { label: "Questions fréquentes", href: "/#faq" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-navy-950 text-sand-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo variant="light" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sand-300/70">
              La plateforme immobilière augmentée par l&rsquo;intelligence
              artificielle. Vendez au juste prix, achetez en confiance,
              investissez avec des données.
            </p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-sand-300/80 transition-colors hover:text-sand-50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-navy-800 pt-8 sm:flex-row">
          <p className="text-xs text-sand-300/50">
            © {new Date().getFullYear()} Immobil&rsquo;IA. Données de démonstration —
            aucune offre réelle.
          </p>
          <div className="flex gap-6 text-xs text-sand-300/50">
            <span>Mentions légales</span>
            <span>Confidentialité</span>
            <span>CGU</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
