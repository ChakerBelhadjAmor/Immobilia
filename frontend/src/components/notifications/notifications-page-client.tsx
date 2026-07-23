"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellOff,
  Home,
  MessageCircle,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import type { AppNotification, NotificationKind } from "@/types";
import { notifications as initialNotifications } from "@/data/community";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeDate } from "@/lib/utils";

const kindIcon: Record<NotificationKind, typeof Bell> = {
  offre_similaire: Home,
  message: MessageCircle,
  prix: TrendingDown,
  visite: Bell,
  systeme: Sparkles,
  alerte: Bell,
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const Icon = kindIcon[notification.kind];
  const content = (
    <div
      className={cn(
        "flex gap-3.5 rounded-card border p-4 transition-colors",
        notification.read
          ? "border-sand-200 bg-white"
          : "border-gold-300 bg-gold-50",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          notification.read ? "bg-sand-100 text-navy-400" : "bg-navy-800 text-gold-400",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-navy-900">{notification.title}</p>
          {!notification.read && (
            <span className="mt-1 size-2 shrink-0 rounded-full bg-gold-500" aria-hidden />
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-navy-500">
          {notification.body}
        </p>
        <p className="mt-1.5 text-xs text-navy-400">
          {formatRelativeDate(notification.date)}
        </p>
      </div>
    </div>
  );

  return notification.href ? (
    <Link href={notification.href} onClick={() => onRead(notification.id)}>
      {content}
    </Link>
  ) : (
    <button className="w-full text-left" onClick={() => onRead(notification.id)}>
      {content}
    </button>
  );
}

export function NotificationsPageClient() {
  const [items, setItems] = useState(initialNotifications);

  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Tout marquer comme lu
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={<BellOff className="size-6" aria-hidden />}
            title="Aucune notification"
            description="Vous serez alertée dès qu'il se passe quelque chose d'important."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <NotificationItem notification={n} onRead={markRead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
