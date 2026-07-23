import Image from "next/image";
import { Star } from "lucide-react";
import { Reveal, SectionHeading } from "./reveal";

const testimonials = [
  {
    quote:
      "L'IA m'a signalé que mon prix était 9 % au-dessus du marché. J'ai ajusté, et j'ai vendu en 32 jours au lieu des 4 mois de ma première tentative.",
    name: "Camille R.",
    role: "A vendu un 4 pièces à Paris 17e",
    avatar: "https://i.pravatar.cc/96?img=47",
    rating: 5,
  },
  {
    quote:
      "La vérification par image a détecté que « mon » studio était déjà loué sur un autre site avec un prix différent. Arnaque évitée, 900 € de caution sauvés.",
    name: "Sami B.",
    role: "Locataire à Lille",
    avatar: "https://i.pravatar.cc/96?img=13",
    rating: 5,
  },
  {
    quote:
      "Le rapport d'investissement m'a montré qu'un DPE E me coûterait une interdiction de louer en 2028. J'ai négocié 25 k€ de moins pour financer la rénovation.",
    name: "Marc D.",
    role: "Investisseur, 3 biens en portefeuille",
    avatar: "https://i.pravatar.cc/96?img=68",
    rating: 5,
  },
  {
    quote:
      "Les questions de visite suggérées m'ont fait découvrir un ravalement voté non mentionné. Le vendeur l'a pris à sa charge, comme la loi le prévoit.",
    name: "Inès K.",
    role: "Primo-accédante à Nantes",
    avatar: "https://i.pravatar.cc/96?img=31",
    rating: 4,
  },
];

export function Testimonials() {
  return (
    <section className="bg-sand-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Ils nous font confiance"
          title="Des décisions immobilières qui finissent bien"
        />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-card border border-sand-200 bg-white p-6 shadow-card">
                <div
                  className="flex gap-0.5"
                  role="img"
                  aria-label={`Note : ${t.rating} sur 5`}
                >
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`size-4 ${
                        s < t.rating
                          ? "fill-gold-500 text-gold-500"
                          : "text-sand-300"
                      }`}
                      aria-hidden
                    />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-navy-700">
                  «&nbsp;{t.quote}&nbsp;»
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-sand-100 pt-4">
                  <Image
                    src={t.avatar}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-navy-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-navy-400">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
