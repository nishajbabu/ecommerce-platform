"use client";

import * as React from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FilterState {
  categoryId: number | null;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
}

interface FilterSidebarProps {
  categories: Category[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const PRICE_PRESETS = [
  { label: "All Prices", min: "", max: "" },
  { label: "Under ₹2,000", min: "", max: "2000" },
  { label: "₹2,000 – ₹5,000", min: "2000", max: "5000" },
  { label: "Above ₹5,000", min: "5000", max: "" },
];

export default function FilterSidebar({
  categories,
  filters,
  onChange,
  onReset,
  hasActiveFilters,
}: FilterSidebarProps) {
  return (
    <aside className="w-full space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-900">
          <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
          Filters
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-zinc-900">Category</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onChange({ ...filters, categoryId: null })}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors cursor-pointer",
              filters.categoryId === null
                ? "bg-zinc-900 font-medium text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            )}
          >
            <span>All Products</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange({ ...filters, categoryId: cat.id })}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors cursor-pointer",
                filters.categoryId === cat.id
                  ? "bg-zinc-900 font-medium text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              )}
            >
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3 border-t border-zinc-100 pt-5">
        <p className="text-xs font-semibold text-zinc-900">Price Range</p>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset) => {
            const active =
              filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() =>
                  onChange({
                    ...filters,
                    minPrice: preset.min,
                    maxPrice: preset.max,
                  })
                }
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Min/Max Inputs */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500">
              Min (₹)
            </label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) =>
                onChange({ ...filters, minPrice: e.target.value })
              }
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500">
              Max (₹)
            </label>
            <input
              type="number"
              min={0}
              placeholder="50000"
              value={filters.maxPrice}
              onChange={(e) =>
                onChange({ ...filters, maxPrice: e.target.value })
              }
              className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2.5 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Availability Toggle */}
      <div className="border-t border-zinc-100 pt-5">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <span className="text-xs font-semibold text-zinc-900">
            In Stock Only
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.inStockOnly}
            onClick={() =>
              onChange({ ...filters, inStockOnly: !filters.inStockOnly })
            }
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer",
              filters.inStockOnly ? "bg-zinc-900" : "bg-zinc-200"
            )}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform",
                filters.inStockOnly ? "translate-x-4.5" : "translate-x-1"
              )}
            />
          </button>
        </label>
      </div>
    </aside>
  );
}