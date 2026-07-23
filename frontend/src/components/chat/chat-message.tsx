import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function ChatMessage({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: ReactNode;
}) {
  const isAssistant = role === "assistant";
  return (
    <div className={cn("flex gap-3", !isAssistant && "flex-row-reverse")}>
      {isAssistant && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-gold-400">
          <Sparkles className="size-4" aria-hidden />
        </span>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isAssistant
            ? "rounded-tl-sm bg-white border border-sand-200 text-navy-700"
            : "rounded-tr-sm bg-navy-800 text-sand-50",
        )}
      >
        {children}
      </div>
    </div>
  );
}
