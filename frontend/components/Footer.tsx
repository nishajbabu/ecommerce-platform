"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Sparkles, Truck } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/login")) {
    return null;
  }

  return (
    <footer className="border-t border-zinc-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-xs font-bold text-white">
                N
              </div>
              <span className="text-base font-semibold tracking-tight text-zinc-950">
                NeuraShop
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
              Precision-curated hardware and smart electronics backed by real-time
              inventory intelligence and Groq Llama-3 shopping assistance.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified Hardware
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-zinc-700" />
                Express Dispatch
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                AI-Assisted Support
              </span>
            </div>
          </div>

          {/* Storefront */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/" className="hover:text-zinc-950 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-zinc-950 transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-zinc-950 transition-colors">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
              Enterprise
            </h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>
                <Link href="/login" className="hover:text-zinc-950 transition-colors">
                  Customer Sign In
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-zinc-950 transition-colors">
                  Operations Console
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-6 text-xs text-zinc-400 sm:flex-row">
          <p>© 2026 NeuraShop by NeuraGlobal. All rights reserved.</p>
          <p>Enterprise Tech Commerce</p>
        </div>
      </div>
    </footer>
  );
}