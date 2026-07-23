/* ------------------------------------------------------------------
   Immobil'IA domain types
   Mirrors the future backend API contracts so the mock service layer
   can be swapped for real endpoints without touching the UI.
------------------------------------------------------------------ */

export type UserRole = "vendeur" | "acheteur" | "investisseur";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  memberSince: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
}

export type TransactionType = "vente" | "location";

export type PropertyType =
  | "appartement"
  | "maison"
  | "studio"
  | "loft"
  | "duplex"
  | "immeuble";

export type PropertyStatus =
  | "disponible"
  | "sous_offre"
  | "loue"
  | "vendu"
  | "brouillon"
  | "en_verification";

export type PropertySource = "plateforme" | "web";

export interface GeoPoint {
  /** Position on the stylised district map, percentage 0–100. */
  x: number;
  y: number;
}

export type PoiKind =
  | "ecole"
  | "universite"
  | "transport"
  | "commerce"
  | "parc"
  | "hopital"
  | "bruit"
  | "pollution"
  | "embouteillage";

export interface PointOfInterest {
  id: string;
  kind: PoiKind;
  label: string;
  position: GeoPoint;
  /** Walking distance from the property, in minutes. */
  distanceMin: number;
  /** Negative POIs (bruit, pollution…) flag risk instead of amenity. */
  negative?: boolean;
}

export interface NeighborhoodScore {
  overall: number;
  securite: number;
  transport: number;
  bruit: number;
  commerces: number;
  ecoles: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  score: NeighborhoodScore;
  /** Marked when the district scores poorly — EF-L-05. */
  flagged: boolean;
  flagReason?: string;
  trend: "hausse" | "stable" | "baisse";
  pricePerSqm: number;
  pois: PointOfInterest[];
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  transaction: TransactionType;
  status: PropertyStatus;
  price: number;
  /** Monthly charges for rentals. */
  charges?: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  yearBuilt: number;
  energyClass: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  address: string;
  city: string;
  postalCode: string;
  neighborhoodId: string;
  position: GeoPoint;
  images: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  floorPlanUrl?: string;
  ownerId: string;
  source: PropertySource;
  sourceName?: string;
  publishedAt: string;
  /** AI scores — EF-V-07 / EF-L-04. */
  qualityScore: number;
  honestyScore: number;
  aiPriceEstimate: number;
  features: string[];
  viewCount: number;
  favoriteCount: number;
  availabilityVerified: boolean;
}

export interface Review {
  id: string;
  propertyId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  propertyId: string;
  participantIds: string[];
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export type NotificationKind =
  | "offre_similaire"
  | "message"
  | "prix"
  | "visite"
  | "systeme"
  | "alerte";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  date: string;
  read: boolean;
  href?: string;
}

export type OfferStatus = "en_attente" | "acceptee" | "refusee" | "expiree";

export interface Offer {
  id: string;
  propertyId: string;
  buyerName: string;
  amount: number;
  status: OfferStatus;
  date: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  date: string;
  resultCount: number;
  alertEnabled: boolean;
}

/* ---------------------- AI analysis payloads ---------------------- */

export interface PriceRecommendation {
  recommended: number;
  marketLow: number;
  marketHigh: number;
  verdict: "correct" | "trop_eleve" | "trop_faible";
  deltaPercent: number;
  rationale: string;
}

export interface ChargesRecommendation {
  monthly: number;
  breakdown: { label: string; amount: number }[];
  note: string;
}

export type IssueSeverity = "info" | "warning" | "error";

export interface DescriptionIssue {
  severity: IssueSeverity;
  field: string;
  message: string;
}

export interface QualityScoreResult {
  score: number;
  suggestions: { label: string; impact: number; done: boolean }[];
}

export interface FraudAlert {
  severity: IssueSeverity;
  excerpt: string;
  reason: string;
  law?: string;
}

export interface ContractSection {
  title: string;
  content: string;
}

export interface GeneratedContract {
  title: string;
  reference: string;
  sections: ContractSection[];
  regulations: { title: string; description: string; mandatory: boolean }[];
  verified?: boolean;
  verificationIssues?: string[];
}

export interface VisitQuestion {
  category: string;
  question: string;
  why: string;
}

export interface ComparisonRow {
  criterion: string;
  values: string[];
  bestIndex: number | null;
}

export interface ComparisonResult {
  propertyIds: string[];
  rows: ComparisonRow[];
  pros: string[][];
  cons: string[][];
  verdict: string;
}

/* ---------------------- Investisseur ---------------------- */

export interface YieldSimulation {
  grossYield: number;
  netYield: number;
  monthlyRent: number;
  annualCosts: number;
  cashflow: number;
  paybackYears: number;
}

export interface WhatIfScenario {
  id: string;
  label: string;
  description: string;
  deltaYield: number;
  deltaValue: number;
}

export interface RiskFactor {
  label: string;
  level: "faible" | "modere" | "eleve";
  detail: string;
}

export interface RiskScore {
  score: number;
  factors: RiskFactor[];
}

export interface CapitalGainForecast {
  now: number;
  in5Years: number;
  in10Years: number;
  annualGrowthPercent: number;
  neighborhoodTrend: string;
}

export interface InvestmentReport {
  propertyId: string;
  generatedAt: string;
  yieldSimulation: YieldSimulation;
  riskScore: RiskScore;
  forecast: CapitalGainForecast;
  scenarios: WhatIfScenario[];
  summary: string;
}

export interface PortfolioStat {
  label: string;
  value: string;
  change: number;
}

/* ---------------------- Colocation ---------------------- */

export interface ColocProfile {
  id: string;
  name: string;
  age: number;
  avatarUrl: string;
  occupation: string;
  budget: number;
  city: string;
  compatibility: number;
  tags: string[];
  bio: string;
}

/* ---------------------- Outils transverses ---------------------- */

export interface DecorationIdea {
  id: string;
  title: string;
  style: string;
  budget: number;
  imageUrl: string;
  items: { label: string; price: number }[];
  regulationNote?: string;
}

export interface RepairFinding {
  id: string;
  zone: string;
  issue: string;
  severity: IssueSeverity;
  estimatedCost: [number, number];
  scoreImpact: number;
  priceImpact: number;
}

export interface StagingExample {
  id: string;
  title: string;
  beforeUrl: string;
  afterUrl: string;
  costEstimate: number;
  valueGain: number;
}

/* ---------------------- Divers ---------------------- */

export interface CompetitorListing {
  id: string;
  title: string;
  price: number;
  surface: number;
  pricePerSqm: number;
  distanceKm: number;
  imageUrl: string;
  source: PropertySource;
  publishedAt: string;
}

export interface Report {
  id: string;
  propertyId: string;
  kind: "scam" | "comportement";
  reason: string;
  date: string;
  status: "en_cours" | "traite";
}
