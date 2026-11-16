import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "ai";
}

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  warning: "bg-amber-50 text-amber-700 border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border-rose-200/80",
  ai: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
};

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}