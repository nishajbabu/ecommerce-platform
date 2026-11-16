"use client";

import * as React from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Layers } from "lucide-react";

export interface AdminOrder {
  id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: string;
  items: Array<{
    id: number;
    quantity: number;
    price_at_purchase: number;
    product: { title: string };
  }>;
}

interface AdminAnalyticsChartsProps {
  orders: AdminOrder[];
}

const STATUS_META = [
  { key: "pending", label: "Pending", barClass: "bg-amber-500", dotClass: "bg-amber-500" },
  { key: "processing", label: "Processing", barClass: "bg-indigo-500", dotClass: "bg-indigo-500" },
  { key: "shipped", label: "Shipped", barClass: "bg-sky-500", dotClass: "bg-sky-500" },
  { key: "delivered", label: "Delivered", barClass: "bg-emerald-500", dotClass: "bg-emerald-500" },
  { key: "cancelled", label: "Cancelled", barClass: "bg-rose-500", dotClass: "bg-rose-500" },
];

export default function AdminAnalyticsCharts({
  orders,
}: AdminAnalyticsChartsProps) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  const dailySeries = React.useMemo(() => {
    const map = new Map<
      string,
      { dateKey: string; label: string; revenue: number; count: number }
    >();

    const sorted = [...orders].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    for (const o of sorted) {
      if (o.status === "cancelled") continue;
      const d = new Date(o.created_at);
      const dateKey = d.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("en-IN", {
        month: "short",
        day: "numeric",
      }).format(d);

      const existing = map.get(dateKey) || {
        dateKey,
        label,
        revenue: 0,
        count: 0,
      };
      existing.revenue += Number(o.total_amount) || 0;
      existing.count += 1;
      map.set(dateKey, existing);
    }

    return Array.from(map.values()).slice(-10);
  }, [orders]);

  const width = 560;
  const height = 210;
  const padX = 28;
  const padTop = 20;
  const padBottom = 32;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const maxRevenue = Math.max(1, ...dailySeries.map((point) => point.revenue));

  const points = dailySeries.map((point, idx) => {
    const x =
      dailySeries.length === 1
        ? padX + innerW / 2
        : padX + (idx / (dailySeries.length - 1)) * innerW;
    const y = padTop + innerH - (point.revenue / maxRevenue) * innerH;
    return { ...point, x, y };
  });

  const linePath =
    points.length > 1
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : "";

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${
          padTop + innerH
        } L ${points[0].x} ${padTop + innerH} Z`
      : "";

  const totalOrders = orders.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Revenue SVG Area Chart */}
      <div className="lg:col-span-7 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Revenue Trend
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Daily gross merchandise volume (excluding cancelled orders)
            </p>
          </div>
          {hoveredIdx !== null && points[hoveredIdx] && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-right">
              <p className="text-[11px] font-medium text-zinc-500">
                {points[hoveredIdx].label} · {points[hoveredIdx].count} orders
              </p>
              <p className="font-mono text-xs font-semibold text-zinc-950 tabular-nums">
                {formatCurrency(points[hoveredIdx].revenue)}
              </p>
            </div>
          )}
        </div>

        {points.length === 0 ? (
          <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 text-xs text-zinc-400">
            No completed revenue data yet.
          </div>
        ) : (
          <div className="relative w-full overflow-hidden text-zinc-900 dark:text-indigo-400">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-52 w-full overflow-visible"
              role="img"
              aria-label="Daily revenue trend chart"
            >
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = padTop + innerH * (1 - tick);
                return (
                  <line
                    key={tick}
                    x1={padX}
                    x2={width - padX}
                    y1={y}
                    y2={y}
                    className="stroke-zinc-100 dark:stroke-zinc-800"
                    strokeWidth={1}
                  />
                );
              })}

              {points.length > 1 && (
                <>
                  <path d={areaPath} fill="url(#revGradient)" />
                  <path
                    d={linePath}
                    fill="none"
                    className="stroke-zinc-900 dark:stroke-indigo-400"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {points.map((p, idx) => {
                const isHovered = hoveredIdx === idx;
                return (
                  <g
                    key={p.dateKey}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
                    {isHovered && (
                      <line
                        x1={p.x}
                        x2={p.x}
                        y1={padTop}
                        y2={padTop + innerH}
                        className="stroke-zinc-300 dark:stroke-zinc-700"
                        strokeDasharray="3 3"
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5 : 3.5}
                      className={
                        isHovered
                          ? "fill-indigo-600 dark:fill-white stroke-white dark:stroke-zinc-900"
                          : "fill-zinc-900 dark:fill-indigo-400 stroke-white dark:stroke-zinc-900"
                      }
                      strokeWidth={2}
                    />
                    <text
                      x={p.x}
                      y={height - 8}
                      textAnchor="middle"
                      className="fill-zinc-400 dark:fill-zinc-500 text-[10px] font-mono"
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Order Status Pipeline Breakdown */}
      <div className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Fulfillment Pipeline
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Distribution across {totalOrders} total{" "}
            {totalOrders === 1 ? "order" : "orders"}
          </p>
        </div>

        <div className="mt-6 space-y-3.5">
          {STATUS_META.map((status) => {
            const count = orders.filter((o) => o.status === status.key).length;
            const pct =
              totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;

            return (
              <div key={status.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-zinc-700">
                    <span
                      className={`h-2 w-2 rounded-full ${status.dotClass}`}
                    />
                    {status.label}
                  </span>
                  <span className="font-mono text-zinc-500 tabular-nums">
                    {count}{" "}
                    <span className="text-[11px] text-zinc-400">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${status.barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}