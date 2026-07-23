import type { DecorationIdea, RepairFinding, StagingExample } from "@/types";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const decorationIdeas: DecorationIdea[] = [
  {
    id: "d-01",
    title: "Salon scandinave lumineux",
    style: "Scandinave",
    budget: 1850,
    imageUrl: img("photo-1586023492125-27b2c045efd7"),
    items: [
      { label: "Canapé 3 places tissu bouclette", price: 799 },
      { label: "Tapis laine 200×290", price: 349 },
      { label: "Suspension rotin", price: 129 },
      { label: "Enfilade chêne clair", price: 449 },
      { label: "Plantes et cache-pots", price: 124 },
    ],
  },
  {
    id: "d-02",
    title: "Bureau télétravail optimisé",
    style: "Japandi",
    budget: 980,
    imageUrl: img("photo-1493663284031-b7e3aefcae8e"),
    items: [
      { label: "Bureau assis-debout 140 cm", price: 429 },
      { label: "Fauteuil ergonomique", price: 289 },
      { label: "Étagère murale chêne", price: 119 },
      { label: "Lampe architecte", price: 89 },
      { label: "Panneau acoustique feutre", price: 54 },
    ],
    regulationNote:
      "En copropriété, la pose d'étagères sur mur porteur ne nécessite aucune autorisation ; le perçage de cloisons mitoyennes doit rester conforme au règlement intérieur.",
  },
  {
    id: "d-03",
    title: "Chambre cocon sous les toits",
    style: "Bohème",
    budget: 1240,
    imageUrl: img("photo-1499916078039-922301b0eb9b"),
    items: [
      { label: "Lit coffre 160 avec tête capitonnée", price: 549 },
      { label: "Linge de lit gaze de coton", price: 129 },
      { label: "Rideaux lin occultants", price: 159 },
      { label: "Appliques laiton", price: 178 },
      { label: "Banc bout de lit rotin", price: 225 },
    ],
  },
  {
    id: "d-04",
    title: "Cuisine repeinte, effet neuf",
    style: "Contemporain",
    budget: 760,
    imageUrl: img("photo-1556912167-f556f1f39fdf"),
    items: [
      { label: "Peinture spéciale meubles (vert sauge)", price: 96 },
      { label: "Poignées laiton ×12", price: 84 },
      { label: "Crédence adhésive zellige", price: 145 },
      { label: "Plan snack + 2 tabourets", price: 385 },
      { label: "Spots LED sous meubles", price: 50 },
    ],
    regulationNote:
      "En location, la peinture des meubles de cuisine est considérée comme un aménagement réversible : accord écrit du bailleur recommandé mais non obligatoire.",
  },
  {
    id: "d-05",
    title: "Terrasse méditerranéenne",
    style: "Riviera",
    budget: 1490,
    imageUrl: img("photo-1600210492486-724fe5c67fb0"),
    items: [
      { label: "Salon bas résine tressée", price: 690 },
      { label: "Parasol déporté", price: 249 },
      { label: "Oliviers en pot ×2", price: 178 },
      { label: "Guirlande guinguette 10 m", price: 45 },
      { label: "Tapis extérieur + coussins", price: 328 },
    ],
    regulationNote:
      "Les installations en terrasse ne doivent pas dépasser la hauteur du garde-corps sans autorisation de la copropriété (règlement type, art. 9).",
  },
  {
    id: "d-06",
    title: "Entrée fonctionnelle petits espaces",
    style: "Minimaliste",
    budget: 420,
    imageUrl: img("photo-1615873968403-89e068629265"),
    items: [
      { label: "Vestiaire mural avec miroir", price: 189 },
      { label: "Banc à chaussures", price: 129 },
      { label: "Patères chêne ×6", price: 42 },
      { label: "Tapis d'entrée", price: 60 },
    ],
  },
];

export const repairFindings: RepairFinding[] = [
  {
    id: "rep-01",
    zone: "Salle de bains",
    issue: "Traces d'humidité et moisissures en partie haute du mur nord",
    severity: "error",
    estimatedCost: [1200, 2800],
    scoreImpact: -8,
    priceImpact: -6500,
  },
  {
    id: "rep-02",
    zone: "Séjour",
    issue: "Fissure fine (< 2 mm) au-dessus du linteau de la porte-fenêtre",
    severity: "warning",
    estimatedCost: [300, 650],
    scoreImpact: -3,
    priceImpact: -1200,
  },
  {
    id: "rep-03",
    zone: "Cuisine",
    issue: "Joint silicone du plan de travail noirci, à remplacer",
    severity: "info",
    estimatedCost: [60, 120],
    scoreImpact: -1,
    priceImpact: 0,
  },
  {
    id: "rep-04",
    zone: "Chambre 2",
    issue: "Peinture écaillée autour de la fenêtre, possible infiltration ancienne",
    severity: "warning",
    estimatedCost: [250, 500],
    scoreImpact: -2,
    priceImpact: -800,
  },
];

export const stagingExamples: StagingExample[] = [
  {
    id: "st-01",
    title: "Séjour 28 m² — Appartement années 70",
    beforeUrl: img("photo-1583847268964-b28dc8f51f92"),
    afterUrl: img("photo-1586023492125-27b2c045efd7"),
    costEstimate: 2400,
    valueGain: 18000,
  },
  {
    id: "st-02",
    title: "Cuisine fermée — Maison de ville",
    beforeUrl: img("photo-1484154218962-a197022b5858"),
    afterUrl: img("photo-1556912167-f556f1f39fdf"),
    costEstimate: 3100,
    valueGain: 14500,
  },
  {
    id: "st-03",
    title: "Chambre principale — T3 locatif",
    beforeUrl: img("photo-1522771739844-6a9f6d5f14af"),
    afterUrl: img("photo-1499916078039-922301b0eb9b"),
    costEstimate: 1600,
    valueGain: 9000,
  },
];
