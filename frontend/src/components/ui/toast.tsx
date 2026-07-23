"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "info" | "warning" | "error";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success-500" aria-hidden />,
  info: <Info className="size-5 text-navy-500" aria-hidden />,
  warning: <AlertTriangle className="size-5 text-warning-500" aria-hidden />,
  error: <XCircle className="size-5 text-danger-500" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-sand-200",
                "bg-white p-4 shadow-modal",
              )}
              role="status"
            >
              {icons[t.variant]}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy-900">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-sm text-navy-500">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-navy-400 transition hover:bg-sand-100 hover:text-navy-700"
                aria-label="Fermer la notification"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
