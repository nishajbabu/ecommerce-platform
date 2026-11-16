"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  ShieldCheck,
  Package,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, cartCount, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const displayUser = mounted ? user : null;
  const displayCartCount = mounted ? cartCount : 0;

  const isAdminRoute = pathname.startsWith("/admin");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setMobileOpen(false);
    if (q) {
      router.push(`/?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/");
    }
  };

  if (isAdminRoute) {
    return (
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
                N
              </div>
              <span className="text-sm font-semibold tracking-tight text-zinc-950">
                NeuraShop
              </span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Admin Console
            </span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors"
            >
              View Storefront →
            </Link>
            <ThemeToggle />
            {displayUser && (
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white shadow-xs dark:bg-white dark:text-zinc-950">
              N
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold tracking-tight text-zinc-950">
                NeuraShop
              </span>
              <span className="hidden sm:inline-block rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500">
                STORE
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === "/"
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-950"
              )}
            >
              Catalog
            </Link>
            {displayUser && displayUser.role === "customer" && (
              <Link
                href="/orders"
                className={cn(
                  "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/orders")
                    ? "text-zinc-950"
                    : "text-zinc-500 hover:text-zinc-950"
                )}
              >
                <Package className="h-3.5 w-3.5" />
                Orders
              </Link>
            )}
            {displayUser && displayUser.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/70 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100/80 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Console
              </Link>
            )}
          </nav>
        </div>

        {/* Center Search Bar (Desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md items-center"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search laptops, audio, accessories..."
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          <Link
            href="/cart"
            className="relative inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 shadow-xs hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-all"
          >
            <ShoppingBag className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
            <span className="hidden sm:inline">Cart</span>
            {displayCartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 font-mono text-[11px] font-medium text-white dark:bg-white dark:text-zinc-950">
                {displayCartCount}
              </span>
            )}
          </Link>

          {displayUser ? (
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-white dark:text-zinc-950">
                  {displayUser.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-xs font-medium text-zinc-800">
                  {displayUser.full_name?.split(" ")[0] || "Account"}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-zinc-500 hover:border-zinc-200 hover:bg-white hover:text-rose-600 dark:hover:border-zinc-800 dark:hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white shadow-xs hover:bg-zinc-800 transition-colors"
            >
              <UserIcon className="h-3.5 w-3.5" />
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden space-y-4 dark:border-zinc-800 dark:bg-zinc-950">
          <form onSubmit={handleSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
            />
          </form>

          <div className="flex flex-col gap-2 text-sm">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 font-medium text-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Catalog
            </Link>
            {displayUser && displayUser.role === "customer" && (
              <Link
                href="/orders"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 font-medium text-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                My Orders
              </Link>
            )}
            {displayUser && displayUser.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-300"
              >
                Admin Console
              </Link>
            )}
            {displayUser ? (
              <button
                onClick={logout}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-left font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <span>Sign out ({displayUser.full_name?.split(" ")[0]})</span>
                <LogOut className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-center font-medium text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}