"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { ShoppingBag, ArrowLeft, Check, ShieldCheck, Truck, RefreshCw } from "lucide-react";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category?: { name: string };
}

function ProductDetailsContent() {
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    async function loadProduct() {
      try {
        const data = await apiRequest<Product>(`/api/products/${productId}`);
        setProduct(data);
      } catch (err: any) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please sign in to add items to your cart!");
      return;
    }

    setAdding(true);
    try {
      await apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      showToast(`Added "${product.title}" to cart!`);
    } catch (err: any) {
      showToast(err.message || "Could not add to cart");
    } finally {
      setAdding(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-gray-400 font-semibold animate-pulse">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <Link href="/" className="text-sm font-bold text-blue-600 hover:underline">
          ← Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-sm">
        {/* Product Image */}
        <div className="h-96 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-sm">No Image Available</span>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {product.category && (
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
              {product.category.name}
            </span>
          )}

          <h1 className="text-3xl font-extrabold text-gray-900">{product.title}</h1>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-gray-900">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                product.stock_quantity > 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {product.stock_quantity > 0 ? `${product.stock_quantity} In Stock` : "Out of Stock"}
            </span>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock_quantity === 0}
            className={`w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg ${
              product.stock_quantity === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            {product.stock_quantity === 0
              ? "Currently Out of Stock"
              : adding
              ? "Adding to Cart..."
              : "Add to Cart"}
          </button>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 text-center">
            <div className="space-y-1">
              <Truck className="w-5 h-5 text-gray-400 mx-auto" />
              <p className="text-[10px] font-bold text-gray-700">Free Delivery</p>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="w-5 h-5 text-gray-400 mx-auto" />
              <p className="text-[10px] font-bold text-gray-700">1 Year Warranty</p>
            </div>
            <div className="space-y-1">
              <RefreshCw className="w-5 h-5 text-gray-400 mx-auto" />
              <p className="text-[10px] font-bold text-gray-700">7 Days Return</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Outer export that wraps the content in Suspense (Resolves Next.js prerender error)
export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center text-gray-400 font-semibold animate-pulse">
          Loading product...
        </div>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}