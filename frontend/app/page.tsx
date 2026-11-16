"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, PackageX, X, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import HeroSection from "@/components/storefront/HeroSection";
import FilterSidebar, {
  type FilterState,
} from "@/components/storefront/FilterSidebar";
import ProductCard from "@/components/storefront/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = "featured" | "price_asc" | "price_desc";

function StorefrontContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSearch = searchParams.get("search") || "";

  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchInput, setSearchInput] = React.useState(urlSearch);
  const [sortBy, setSortBy] = React.useState<SortOption>("featured");
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  const [filters, setFilters] = React.useState<FilterState>({
    categoryId: null,
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
  });

  React.useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  React.useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiRequest<Category[]>("/api/categories");
        setCategories(res);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    loadCategories();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: "1", limit: "50" });
        if (filters.categoryId) {
          qs.set("category_id", String(filters.categoryId));
        }
        if (urlSearch.trim()) {
          qs.set("search", urlSearch.trim());
        }
        if (filters.minPrice.trim()) {
          qs.set("min_price", filters.minPrice.trim());
        }
        if (filters.maxPrice.trim()) {
          qs.set("max_price", filters.maxPrice.trim());
        }

        const res = await apiRequest<{ products: Product[] }>(
          `/api/products?${qs.toString()}`
        );
        if (!cancelled) {
          setProducts(res.products || []);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters.categoryId, filters.minPrice, filters.maxPrice, urlSearch]);

  const handleLocalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) {
      router.push(`/?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/");
    }
  };

  const resetAllFilters = () => {
    setFilters({
      categoryId: null,
      minPrice: "",
      maxPrice: "",
      inStockOnly: false,
    });
    setSearchInput("");
    if (urlSearch) router.push("/");
  };

  const handleAskAiFallback = () => {
    const prompt = urlSearch.trim()
      ? `I searched for "${urlSearch.trim()}" and didn't find an exact match. What similar items do you recommend in stock?`
      : "No items matched my current filters. What popular products do you recommend right now?";

    window.dispatchEvent(
      new CustomEvent("open-ai-assistant", { detail: { prompt } })
    );
  };

  const hasActiveFilters =
    filters.categoryId !== null ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.inStockOnly ||
    urlSearch.trim() !== "";

  const displayedProducts = React.useMemo(() => {
    const list = filters.inStockOnly
      ? products.filter((p) => p.stock_quantity > 0)
      : [...products];

    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, filters.inStockOnly, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      <HeroSection />

      {/* Catalog Workspace */}
      <section id="catalog" className="space-y-6 scroll-mt-20">
        {/* Top Toolbar */}
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              Product Catalog
            </h2>
            <p className="text-xs text-zinc-500">
              {loading
                ? "Loading inventory..."
                : `Showing ${displayedProducts.length} ${
                    displayedProducts.length === 1 ? "product" : "products"
                  }`}
              {urlSearch && (
                <span>
                  {" "}
                  for{" "}
                  <span className="font-medium text-zinc-900">
                    “{urlSearch}”
                  </span>
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mobile Filter Trigger */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="inline-flex lg:hidden h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 shadow-xs hover:bg-zinc-50 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>

            {/* Quick Catalog Search */}
            <form
              onSubmit={handleLocalSearchSubmit}
              className="relative flex-1 sm:w-56 sm:flex-none"
            >
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Filter by keyword..."
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-7 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:border-zinc-900 focus:outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    if (urlSearch) router.push("/");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort products"
              className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 shadow-xs focus:border-zinc-900 focus:outline-none cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Mobile Collapsible Filter Panel */}
        {mobileFiltersOpen && (
          <div className="lg:hidden">
            <FilterSidebar
              categories={categories}
              filters={filters}
              onChange={setFilters}
              onReset={resetAllFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        )}

        {/* Two-Column Storefront Grid */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Desktop Sticky Sidebar */}
          <div className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-24">
            <FilterSidebar
              categories={categories}
              filters={filters}
              onChange={setFilters}
              onReset={resetAllFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                  >
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="space-y-3 p-5">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-8 w-full pt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <PackageX className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-zinc-950">
                  No matching products
                </h3>
                <p className="mt-1 max-w-xs text-xs text-zinc-500">
                  Try clearing your filters or ask our AI Concierge to suggest
                  alternatives in stock.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Reset all filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAskAiFallback}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Ask AI for recommendations
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      }
    >
      <StorefrontContent />
    </Suspense>
  );
}