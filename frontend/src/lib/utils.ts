import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number) {
  return euroFormatter.format(value);
}

export function formatPriceCompact(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M€`;
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1000)} k€`;
  }
  return euroFormatter.format(value);
}

export function formatSurface(value: number) {
  return `${value.toLocaleString("fr-FR")} m²`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatRelativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days} j`;
  const months = Math.floor(days / 30);
  return `Il y a ${months} mois`;
}

/** Simulates network latency for mock services. */
export function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
