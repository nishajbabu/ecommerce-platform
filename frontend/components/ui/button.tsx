import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 shadow-xs border border-transparent",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 border border-zinc-200/70",
  outline:
    "bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 shadow-xs",
  ghost: "bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 shadow-xs border border-transparent",
  ai: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs border border-transparent",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs rounded-md gap-1.5",
  md: "h-9 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-6 text-sm rounded-lg gap-2",
  icon: "h-9 w-9 rounded-lg justify-center",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}