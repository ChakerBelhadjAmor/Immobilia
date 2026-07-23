"use client";

import { useState } from "react";
import Image from "next/image";
import { Send, MessageSquareOff } from "lucide-react";
import { conversations as initialConversations, messages as initialMessages } from "@/data/community";
import { currentUser } from "@/data/users";
import { properties } from "@/data/properties";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeDate } from "@/lib/utils";

export function MessagesPageClient() {
  const [conversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");

  const active = conversations.find((c) => c.id === activeId);
  const thread = messages.filter((m) => m.conversationId === activeId);
  const property = properties.find((p) => p.id === active?.propertyId);

  const send = () => {
    if (!draft.trim() || !active) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        conversationId: active.id,
        senderId: currentUser.id,
        content: draft.trim(),
        sentAt: new Date().toISOString(),
        read: true,
      },
    ]);
    setDraft("");
  };

  if (conversations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={<MessageSquareOff className="size-6" aria-hidden />}
          title="Aucune conversation"
          description="Contactez un propriétaire depuis une annonce pour démarrer une discussion."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid w-full overflow-hidden rounded-card border border-sand-200 bg-white shadow-card md:grid-cols-[320px_1fr]">
        {/* Liste des conversations */}
        <div className="hidden overflow-y-auto border-r border-sand-200 md:block">
          <div className="border-b border-sand-200 p-4">
            <h1 className="font-display text-lg font-semibold text-navy-900">
              Messages
            </h1>
          </div>
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-sand-100 p-4 text-left transition-colors hover:bg-sand-50",
                    activeId === c.id && "bg-gold-50",
                  )}
                >
                  <Image
                    src={c.participantAvatar}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-navy-900">
                        {c.participantName}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="tnum flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-navy-400">
                      {c.lastMessage}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Fil de discussion */}
        <div className="flex flex-col">
          {active && (
            <div className="flex items-center gap-3 border-b border-sand-200 p-4">
              <Image
                src={active.participantAvatar}
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-full"
              />
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  {active.participantName}
                </p>
                {property && (
                  <p className="text-xs text-navy-400">{property.title}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {thread.map((m) => {
              const isMe = m.senderId === currentUser.id;
              return (
                <div
                  key={m.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      isMe
                        ? "rounded-tr-sm bg-navy-800 text-sand-50"
                        : "rounded-tl-sm bg-sand-100 text-navy-800",
                    )}
                  >
                    {m.content}
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        isMe ? "text-sand-300/60" : "text-navy-400",
                      )}
                    >
                      {formatRelativeDate(m.sentAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2 border-t border-sand-200 p-3"
          >
            <label htmlFor="message-draft" className="sr-only">
              Votre message
            </label>
            <input
              id="message-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Écrire un message…"
              className="h-11 flex-1 rounded-xl border border-sand-300 bg-sand-50 px-4 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
            />
            <button
              type="submit"
              aria-label="Envoyer"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-sand-50 transition-colors hover:bg-navy-700"
            >
              <Send className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
