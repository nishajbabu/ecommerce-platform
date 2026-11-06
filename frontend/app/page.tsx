"use client";

import { useEffect, useState } from "react";
import { Search, ShoppingBag, Check, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category_id: number;
  category?: { name: string };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Categories and Products on page load
  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await apiRequest<Category[]>("/api/categories");
        setCategories(catRes);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
      fetchProducts();
    }
    loadData();
  }, []);

  // Re-fetch products when category or search changes
  async function fetchProducts(catId: number | null = selectedCategory, search: string = searchQuery) {
    setLoading(true);
    try {
      let queryParams = "?page=1&limit=20";
      if (catId) queryParams += `&category_id=${catId}`;
      if (search.trim()) queryParams += `&search=${encodeURIComponent(search.trim())}`;

      const res = await apiRequest<{ products: Product[] }>(`/api/products${queryParams}`);
      setProducts(res.products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCategoryClick = (catId: number | null) => {
    setSelectedCategory(catId);
    fetchProducts(catId, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(selectedCategory, searchQuery);
  };

  const handleAddToCart = async (product: Product) => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please sign in to add items to your cart!");
      return;
    }

    setAddingId(product.id);
    try {
      await apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      showToast(`Added "${product.title}" to your cart!`);
    } catch (err: any) {
      showToast(err.message || "Could not add to cart");
    } finally {
      setAddingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 transition transform animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-8 sm:p-12 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            Curated Tech & Lifestyle
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Discover the Future of Smart Shopping
          </h1>
          <p className="text-blue-100 text-base sm:text-lg">
            High-grade electronics and accessories at fair pricing. Real-time stock, instant checkout.
          </p>
        </div>
      </section>

      {/* Search Bar & Filter Controls */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              selectedCategory === null
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        </form>
      </section>

      {/* Product Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No products found</h3>
            <p className="text-sm text-gray-500">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                {/* Image Container */}
                <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image Available
                    </div>
                  )}
                  {/* Category Pill Tag */}
                  {p.category && (
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-xs font-semibold text-gray-800 px-2.5 py-1 rounded-md shadow-sm">
                      {p.category.name}
                    </span>
                  )}
                </div>

                {/* Details Container */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Price</span>
                      <span className="text-lg font-black text-gray-900">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={addingId === p.id || p.stock_quantity === 0}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                        p.stock_quantity === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {p.stock_quantity === 0 ? "Out of Stock" : addingId === p.id ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}