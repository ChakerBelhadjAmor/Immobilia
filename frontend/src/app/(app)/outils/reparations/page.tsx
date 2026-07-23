import type { Metadata } from "next";
import { RepairsPageClient } from "@/components/tools/repairs-page-client";

export const metadata: Metadata = {
  title: "Estimation de réparations",
  description:
    "Détectez les besoins de réparation à partir de photos et mesurez leur impact sur le score et le prix estimé du bien.",
};

export default function RepairsPage() {
  return <RepairsPageClient />;
}
