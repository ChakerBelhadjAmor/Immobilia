import type { PropertyType, TransactionType } from "@/types";

export interface ListingDraft {
  title: string;
  type: PropertyType;
  transaction: TransactionType;
  city: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  price: number;
  description: string;
  photoCount: number;
  hasVideo: boolean;
}

export const emptyDraft: ListingDraft = {
  title: "",
  type: "appartement",
  transaction: "vente",
  city: "",
  surface: 60,
  rooms: 3,
  bedrooms: 2,
  price: 300000,
  description: "",
  photoCount: 0,
  hasVideo: false,
};

export const wizardSteps = [
  "Le bien",
  "Description",
  "Prix & charges",
  "Concurrence",
  "Score qualité",
  "Conformité",
  "Publier",
] as const;

export type WizardStep = (typeof wizardSteps)[number];
