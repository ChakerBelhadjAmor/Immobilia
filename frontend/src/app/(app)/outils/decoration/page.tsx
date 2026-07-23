import type { Metadata } from "next";
import { DecorationPageClient } from "@/components/tools/decoration-page-client";

export const metadata: Metadata = {
  title: "Idées de décoration",
  description:
    "Téléversez une photo et obtenez des idées de décoration selon votre budget et vos préférences, générées par l'IA.",
};

export default function DecorationPage() {
  return <DecorationPageClient />;
}
