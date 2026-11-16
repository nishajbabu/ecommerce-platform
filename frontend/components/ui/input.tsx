import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  className,
  label,
  error,
  id,
  ...props
}: InputProps) {
  const inputId = id || React.useId();

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-zinc-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 focus-visible:border-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
          error && "border-rose-300 focus-visible:border-rose-500 focus-visible:ring-rose-500/15",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}