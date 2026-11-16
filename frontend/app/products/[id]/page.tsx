"use client";

import * as React from "react";
import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Minus,
  Plus,
  PackageOpen,
  Zap,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/storefront/ProductCard";

function ProductDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params?.id as string;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [related, setRelated] = React.useState<Product[]>([]);
  const [quantity, setQuantity] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    if (!productId) return;

    async function loadProduct() {
      setLoading(true);
      try {
        const data = await apiRequest<Product>(`/api/products/${productId}`);
        setProduct(data);
        setQuantity(1);

        if (data?.category_id) {
          try {
            const relRes = await apiRequest<{ products: Product[] }>(
              `/api/products?category_id=${data.category_id}&limit=4`
            );
            setRelated(
              (relRes.products || []).filter((p) => p.id !== data.id).slice(0, 3)
            );
          } catch {
            // Optional related products fetch
          }
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const handleAddToCart = async (redirectToCart = false) => {
    if (!product) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        type: "info",
        title: "Sign in required",
        description: "Please sign in to add items to your cart.",
      });
      if (redirectToCart) router.push("/login");
      return;
    }

    setAdding(true);
    try {
      await apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity }),
      });
      window.dispatchEvent(new Event("cart-updated"));
      toast({
        type: "success",
        title: "Added to cart",
        description: `${quantity} × ${product.title} added to your cart.`,
      });
      if (redirectToCart) {
        router.push("/cart");
      }
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Could not add to cart",
        description:
          err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-5 pt-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-semibold text-zinc-950">
          Product Not Found
        </h2>
        <p className="text-sm text-zinc-500">
          This item may have been removed or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-950 transition-colors">
          Store
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
        {product.category?.name && (
          <>
            <span>{product.category.name}</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          </>
        )}
        <span className="font-medium text-zinc-900 truncate">
          {product.title}
        </span>
      </nav>

      {/* Main Product Split */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
        {/* Left: Product Gallery Frame */}
        <div className="lg:col-span-6">
          <div className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400">
                <PackageOpen className="h-10 w-10 stroke-[1.5]" />
                <span className="text-xs font-medium">No Image Available</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Specifications & Purchase Panel */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-3 border-b border-zinc-100 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              {product.category?.name && (
                <Badge variant="neutral">{product.category.name}</Badge>
              )}
              {isOutOfStock ? (
                <Badge variant="danger">Out of Stock</Badge>
              ) : isLowStock ? (
                <Badge variant="warning">
                  Low Stock · {product.stock_quantity} remaining
                </Badge>
              ) : (
                <Badge variant="success">
                  In Stock · {product.stock_quantity} available
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              {product.title}
            </h1>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-mono text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                {formatCurrency(product.price)}
              </span>
              <span className="text-xs text-zinc-500">
                Inclusive of all taxes
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
              Overview
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600">
              {product.description}
            </p>
          </div>

          {/* Quantity & Action Row */}
          <div className="space-y-3 pt-2">
            {!isOutOfStock && (
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-2.5">
                <span className="text-xs font-medium text-zinc-700">
                  Quantity
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center font-mono text-sm font-medium text-zinc-950 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stock_quantity, q + 1)
                      )
                    }
                    disabled={quantity >= product.stock_quantity}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                variant="outline"
                disabled={isOutOfStock}
                isLoading={adding}
                onClick={() => handleAddToCart(false)}
                className="w-full"
              >
                <ShoppingBag className="h-4 w-4" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                variant="primary"
                disabled={isOutOfStock}
                isLoading={adding}
                onClick={() => handleAddToCart(true)}
                className="w-full"
              >
                <Zap className="h-4 w-4" />
                Buy Now
              </Button>
            </div>
          </div>

          {/* Enterprise Value Propositions */}
          <div className="grid grid-cols-1 gap-3 border-t border-zinc-100 pt-6 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
              <Truck className="h-4 w-4 text-zinc-700" />
              <p className="mt-2 text-xs font-semibold text-zinc-900">
                Free Delivery
              </p>
              <p className="text-[11px] text-zinc-500">Tracked express ship</p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <p className="mt-2 text-xs font-semibold text-zinc-900">
                1-Year Warranty
              </p>
              <p className="text-[11px] text-zinc-500">Verified protection</p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
              <RefreshCw className="h-4 w-4 text-zinc-700" />
              <p className="mt-2 text-xs font-semibold text-zinc-900">
                7-Day Returns
              </p>
              <p className="text-[11px] text-zinc-500">Easy replacement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-5 border-t border-zinc-200 pt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              Similar in {product.category?.name || "this category"}
            </h2>
            <Link
              href="/"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}