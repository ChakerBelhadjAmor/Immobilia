import type { Metadata } from "next";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Retrouvez toutes vos notifications : offres similaires, messages, alertes prix.",
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
