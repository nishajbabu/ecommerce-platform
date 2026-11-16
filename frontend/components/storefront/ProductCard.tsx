"use client";

import * as React from "react";
import Link from "next/link";
import { PackageOpen, Plus, Check } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Product } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const [adding, setAdding] = React.useState(false);
  const [justAdded, setJustAdded] = React.useState(false);

  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        type: "info",
        title: "Sign in required",
        description: "Please sign in to add items to your cart.",
      });
      return;
    }

    setAdding(true);
    try {
      await apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });

      window.dispatchEvent(new Event("cart-updated"));
      setJustAdded(true);
      toast({
        type: "success",
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
      setTimeout(() => setJustAdded(false), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not add to cart";
      toast({
        type: "error",
        title: "Action failed",
        description: msg,
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white transition-all duration-200 hover:border-zinc-300 hover:shadow-md">
      {/* Image Frame */}
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 block"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
              isOutOfStock && "opacity-60 grayscale-[30%]"
            )}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-zinc-400">
            <PackageOpen className="h-7 w-7 stroke-[1.5]" />
            <span className="text-[11px] font-medium">No Image</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {product.category?.name ? (
            <span className="rounded-md border border-zinc-200/80 bg-white/95 px-2 py-0.5 text-[11px] font-medium text-zinc-800 backdrop-blur-sm">
              {product.category.name}
            </span>
          ) : (
            <span />
          )}

          {isOutOfStock ? (
            <Badge variant="danger">Out of stock</Badge>
          ) : isLowStock ? (
            <Badge variant="warning">Only {product.stock_quantity} left</Badge>
          ) : null}
        </div>
      </Link>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-1.5">
          <Link href={`/products/${product.id}`} className="block">
            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-zinc-950 transition-colors group-hover:text-indigo-600">
              {product.title}
            </h3>
          </Link>
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {product.description}
          </p>
        </div>

        {/* Footer Price + Action */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3.5">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Price
            </span>
            <span className="font-mono text-base font-semibold tracking-tight text-zinc-950 tabular-nums">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || isOutOfStock}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all cursor-pointer",
              isOutOfStock
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                : justAdded
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
            )}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Added
              </>
            ) : isOutOfStock ? (
              "Sold Out"
            ) : adding ? (
              "Adding..."
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}