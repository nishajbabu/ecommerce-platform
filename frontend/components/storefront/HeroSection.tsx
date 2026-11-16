"use client";

import Link from "next/link";
import { ArrowDownRight, ShieldCheck, Truck, Zap } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-sm">
      {/* Subtle architectural radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-indigo-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
      />

      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs font-medium text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Curated Hardware & Smart Tech
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.08]">
              Precision devices built for{" "}
              <span className="text-zinc-400">modern workflows.</span>
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Verified audio, wearables, and workspace essentials with real-time
              inventory tracking, transparent pricing, and instant dispatch.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#catalog"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Explore Catalog
                <ArrowDownRight className="h-4 w-4" />
              </a>
              <Link
                href="/orders"
                className="inline-flex h-10 items-center rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                Track Orders
              </Link>
            </div>
          </div>

          {/* Right Perimeter Trust Metrics */}
          <div className="grid grid-cols-3 gap-3 border-t border-zinc-800/80 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
            <div className="space-y-1">
              <Truck className="h-4 w-4 text-zinc-400" />
              <p className="text-xs font-medium text-white">Fast Dispatch</p>
              <p className="text-[11px] text-zinc-500">Same-day processing</p>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-medium text-white">1-Yr Warranty</p>
              <p className="text-[11px] text-zinc-500">Official coverage</p>
            </div>
            <div className="space-y-1">
              <Zap className="h-4 w-4 text-indigo-400" />
              <p className="text-xs font-medium text-white">Live Stock</p>
              <p className="text-[11px] text-zinc-500">Real-time inventory</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}