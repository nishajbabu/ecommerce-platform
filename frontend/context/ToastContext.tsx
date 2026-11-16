"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback(
    ({ title, description, type }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg transition-all",
              t.type === "error" ? "border-rose-200" : "border-zinc-200"
            )}
          >
            {t.type === "success" && (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            )}
            {t.type === "error" && (
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
            )}
            {t.type === "info" && (
              <Info className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-zinc-500">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}