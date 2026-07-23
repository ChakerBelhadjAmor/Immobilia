# Immobil'IA

Plateforme immobilière augmentée par l'intelligence artificielle — frontend Next.js.

Immobil'IA met en relation vendeurs/bailleurs, acheteurs/locataires et investisseurs, avec une IA qui assiste chaque profil : recommandation de prix, détection d'arnaques, scoring de quartier, rapports d'investissement, décoration, home staging, et plus.

This is **frontend only** — every feature is powered by mock data and fake services (see `src/data/` and `src/services/`), structured so real API endpoints can be swapped in later without touching the UI.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS v4 (custom theme: navy / warm beige / soft gold)
- Framer Motion for animation
- React Hook Form + Zod for form validation
- Lucide React for icons

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/                  routes (App Router)
    (app)/              authenticated app shell — search, map, property detail,
                        vendor/investor spaces, tools, favorites, messages...
    connexion/          login (no app header)
    inscription/        signup (no app header)
  components/
    ui/                 design system primitives (Button, Card, Dialog, Table...)
    layout/             header, footer, logo
    landing/            homepage sections
    property/           property card, gallery, reviews, comparison...
    vendor/             listing creation wizard (7 AI-assisted steps)
    investor/           yield/risk/forecast report, portfolio comparator
    maps/               stylised comparative district map
    chat/               comparison chat, messaging
    colocation/          roommate matching
    tools/              decoration, home staging, repair estimation
  data/                 realistic French mock data (properties, users, reviews...)
  services/             mock "API" layer (property, AI, investor) — swap for real
                        endpoints later without touching components
  types/                shared domain types
  hooks/                localStorage-backed favorites/compare lists
  lib/                  utils (cn, formatters)
```

## Feature coverage

Every requirement from `cahier_des_charges_immobilia.tex` is implemented:

- **Vendeur/bailleur** (EF-V-01→09): listing wizard with AI price recommendation,
  charges estimate, competitive analysis, description verification, quality score,
  regulations/contract generation, fraud & discrimination detection.
- **Locataire/acheteur** (EF-L-01→14): natural-language hybrid search, comparative
  map with points of interest, visit-question assistant, multi-property comparison
  chat, roommate matching, availability verification, reviews, scam reporting,
  floor plan generation, similar-listing alerts.
- **Investisseur** (EF-I-01→06): investment report (yield simulation), what-if
  scenarios, rental risk score, portfolio comparator, 5/10-year capital gain
  forecast, investor dashboard.
- **Tous les acteurs** (EF-T-01→04): decoration ideas, budget-constrained staging,
  before/after home-staging slider, photo-based repair estimation.

## Docker

```bash
docker compose up --build
```

Serves the production build on [http://localhost:3000](http://localhost:3000).
