import { Reveal, SectionHeading } from "./reveal";

const steps = [
  {
    number: "01",
    title: "Décrivez votre projet",
    text: "En langage naturel : votre budget, vos critères, votre mode de vie. Ou déposez votre annonce avec photos et vidéos.",
  },
  {
    number: "02",
    title: "L'IA analyse tout",
    text: "Prix du marché, qualité de l'annonce, quartier, disponibilité réelle, conformité légale : chaque donnée est vérifiée et scorée.",
  },
  {
    number: "03",
    title: "Comparez en confiance",
    text: "Carte comparative, tableau de synthèse multi-biens, score d'honnêteté : les écarts et les pièges sont signalés avant la visite.",
  },
  {
    number: "04",
    title: "Concluez sereinement",
    text: "Questions de visite préparées, contrat conforme généré et vérifié, réglementations applicables résumées.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-navy-950 py-24 sm:py-32" id="comment-ca-marche">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Comment ça marche"
          title="De la recherche à la signature, en quatre temps"
          tone="light"
        />
        <ol className="mt-16 grid gap-px overflow-hidden rounded-card border border-navy-800 bg-navy-800 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.08}>
              <li className="flex h-full flex-col bg-navy-900 p-7">
                <span
                  className="tnum font-display text-4xl font-light text-gold-500/70"
                  aria-hidden
                >
                  {step.number}
                </span>
                <h3 className="mt-5 text-base font-semibold text-sand-50">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-sand-300/70">
                  {step.text}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
