"use client";

import * as React from "react";
import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  RefreshCw,
  Minus,
  Plus,
  PackageOpen,
  Zap,
  Sparkles,
  Share2,
  Copy,
  Check,
  Star,
  MessageSquarePlus,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Product, ProductReview } from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
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
  const [reviews, setReviews] = React.useState<ProductReview[]>([]);
  const [activeImageIdx, setActiveImageIdx] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);

  // Share popover state
  const [shareOpen, setShareOpen] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Review form state
  const [rating, setRating] = React.useState(5);
  const [reviewTitle, setReviewTitle] = React.useState("");
  const [reviewComment, setReviewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const loadReviews = React.useCallback(async (id: string) => {
    try {
      const revData = await apiRequest<ProductReview[]>(
        `/api/products/${id}/reviews`
      );
      setReviews(Array.isArray(revData) ? revData : []);
    } catch {
      // Ignore if unavailable
    }
  }, []);

  React.useEffect(() => {
    if (!productId) return;

    async function loadProduct() {
      setLoading(true);
      try {
        const data = await apiRequest<Product>(`/api/products/${productId}`);
        setProduct(data);
        setActiveImageIdx(0);
        setQuantity(1);
        loadReviews(productId);

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
  }, [productId, loadReviews]);

  const galleryImages = React.useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images.map((i) => i.image_url);
    }
    return product.image_url ? [product.image_url] : [];
  }, [product]);

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

  const handleAskAiAboutProduct = () => {
    if (!product) return;
    window.dispatchEvent(
      new CustomEvent("open-ai-assistant", {
        detail: {
          prompt: `Tell me about "${product.title}" (₹${product.price}) — who is it best for, and how does it compare with other options in your catalog?`,
        },
      })
    );
  };

  const handleCopyShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast({
        type: "success",
        title: "Link copied",
        description: "Product link copied to your clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        type: "error",
        title: "Copy failed",
        description: "Could not copy link.",
      });
    }
  };

  const handleNativeOrToggleShare = async () => {
    if (product && navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on NeuraShop`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to share menu popover
      }
    }
    setShareOpen((v) => !v);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        type: "info",
        title: "Sign in required",
        description: "Please sign in to submit a product review.",
      });
      router.push("/login");
      return;
    }

    setSubmittingReview(true);
    try {
      await apiRequest(`/api/products/${product.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim(),
        }),
      });
      setReviewTitle("");
      setReviewComment("");
      await loadReviews(String(product.id));
      const refreshed = await apiRequest<Product>(
        `/api/products/${product.id}`
      );
      setProduct(refreshed);
      toast({
        type: "success",
        title: "Review published",
        description: "Thank you for rating this product!",
      });
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Could not submit review",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setSubmittingReview(false);
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
  const currentUrl =
    typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
  const shareText = encodeURIComponent(
    `Check out ${product.title} on NeuraShop`
  );

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
        {/* Left: Interactive Multi-Image Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="group relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
            {galleryImages.length > 0 ? (
              <>
                <img
                  src={galleryImages[activeImageIdx] || galleryImages[0]}
                  alt={`${product.title} view ${activeImageIdx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((i) =>
                          i === 0 ? galleryImages.length - 1 : i - 1
                        )
                      }
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-800 shadow-sm hover:bg-white dark:border-zinc-700 dark:bg-zinc-950/85 dark:text-white cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIdx((i) =>
                          i === galleryImages.length - 1 ? 0 : i + 1
                        )
                      }
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-800 shadow-sm hover:bg-white dark:border-zinc-700 dark:bg-zinc-950/85 dark:text-white cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400">
                <PackageOpen className="h-10 w-10 stroke-[1.5]" />
                <span className="text-xs font-medium">No Image Available</span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6">
              {galleryImages.map((src, idx) => (
                <button
                  key={`${idx}-${src.slice(0, 20)}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-xl border bg-white transition-all cursor-pointer",
                    idx === activeImageIdx
                      ? "border-zinc-950 ring-2 ring-zinc-950/20 dark:border-white dark:ring-white/30"
                      : "border-zinc-200 opacity-70 hover:opacity-100"
                  )}
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specifications, Share & Purchase Panel */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-3 border-b border-zinc-100 pb-6">
            <div className="flex items-start justify-between gap-3">
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

              {/* Share Menu Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleNativeOrToggleShare}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>

                {shareOpen && (
                  <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl space-y-1 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                    >
                      {copiedLink ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copiedLink ? "Copied!" : "Copy Product Link"}
                    </button>
                    <a
                      href={`https://wa.me/?text=${shareText}%20${currentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Share on WhatsApp
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Share on X
                    </a>
                  </div>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
              {product.title}
            </h1>

            {/* Rating Summary Row */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3.5 w-3.5",
                      star <= Math.round(product.average_rating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-300 dark:text-zinc-700"
                    )}
                  />
                ))}
              </div>
              <a
                href="#reviews"
                className="font-medium text-zinc-600 hover:text-zinc-950 hover:underline"
              >
                {(product.review_count ?? 0) > 0
                  ? `${product.average_rating?.toFixed(1)} · ${product.review_count} review${
                      product.review_count === 1 ? "" : "s"
                    }`
                  : "No reviews yet · Be the first to review"}
              </a>
            </div>

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

            <button
              type="button"
              onClick={handleAskAiAboutProduct}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-4 py-2.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100/80 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask AI Concierge about this product & alternatives
            </button>
          </div>

          {/* Value Propositions */}
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

      {/* Customer Ratings & Reviews Section */}
      <section
        id="reviews"
        className="scroll-mt-24 border-t border-zinc-200 pt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start"
      >
        {/* Submit Review Form */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">
              Rate & Review This Product
            </h2>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-zinc-700">
                Your Rating
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={cn(
                        "h-6 w-6",
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-300 dark:text-zinc-700"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono text-xs text-zinc-500">
                  {rating}/5
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Headline (Optional)
              </label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="e.g. Great sound quality & battery life"
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Review
              </label>
              <textarea
                required
                minLength={3}
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with build quality, performance, or value..."
                className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
              />
            </div>

            <Button
              type="submit"
              isLoading={submittingReview}
              className="w-full"
            >
              Submit Review
            </Button>
          </form>
        </div>

        {/* Reviews Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold tracking-tight text-zinc-950">
              Customer Reviews ({reviews.length})
            </h3>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-xs text-zinc-500 dark:border-zinc-700">
              No reviews yet. Be the first customer to review {product.title}.
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-white dark:text-zinc-950">
                        {rev.user_name?.charAt(0).toUpperCase() || "C"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-950">
                          {rev.user_name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {formatDate(rev.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3.5 w-3.5",
                            s <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-300 dark:text-zinc-700"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.title && (
                    <p className="text-sm font-semibold text-zinc-950">
                      {rev.title}
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-zinc-600">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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