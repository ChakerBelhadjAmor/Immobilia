import type { Metadata } from "next";
import { MessagesPageClient } from "@/components/chat/messages-page-client";

export const metadata: Metadata = {
  title: "Messages",
  description: "Échangez avec les propriétaires et locataires de vos annonces.",
};

export default function MessagesPage() {
  return <MessagesPageClient />;
}
