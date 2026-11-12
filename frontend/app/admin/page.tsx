"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  FolderPlus,
} from "lucide-react";

interface AnalyticsData {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  low_stock_alerts: Array<{
    product_id: number;
    title: string;
    stock_quantity: number;
    price: number;
  }>;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  stock_quantity: number;
  category_id: number;
  category?: { name: string };
}

interface Order {
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

interface Customer {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "customers">("overview");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCatId, setNewCatId] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // New Category State
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [submittingCategory, setSubmittingCategory] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== "admin") {
        alert("Access Denied: Admin role required");
        router.push("/");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    loadDashboardData();
  }, [router]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [analyticsData, productsData, categoriesData, ordersData, customersData] = await Promise.all([
        apiRequest<AnalyticsData>("/api/admin/analytics"),
        apiRequest<{ products: Product[] }>("/api/products?limit=50"),
        apiRequest<Category[]>("/api/categories"),
        apiRequest<Order[]>("/api/orders"),
        apiRequest<Customer[]>("/api/admin/customers"),
      ]);

      setAnalytics(analyticsData);
      setProducts(productsData.products);
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !newCatId) {
        setNewCatId(categoriesData[0].id.toString());
      }
      setOrders(ordersData);
      setCustomers(customersData);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduct(true);
    try {
      await apiRequest("/api/products", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          price: parseFloat(newPrice),
          stock_quantity: parseInt(newStock),
          image_url: newImageUrl || undefined,
          category_id: parseInt(newCatId),
        }),
      });

      alert("Product created successfully!");
      setNewTitle("");
      setNewDesc("");
      setNewPrice("");
      setNewStock("");
      setNewImageUrl("");
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to create product");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCategory(true);
    try {
      await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCatName,
          description: newCatDesc || undefined,
        }),
      });

      alert(`Category "${newCatName}" created!`);
      setNewCatName("");
      setNewCatDesc("");
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to create category");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    try {
      await apiRequest(`/api/products/${productId}`, { method: "DELETE" });
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await apiRequest(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500 font-semibold animate-pulse">
        Loading Admin Intelligence Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Operations Center</h1>
          <p className="text-sm text-gray-500">Monitor revenue, control live inventory, and manage fulfillment</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "overview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "products" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Inventory ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "orders" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "customers" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Customers ({customers.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === "overview" && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>
                <p className="text-2xl font-black text-gray-900 mt-1">₹{analytics.total_revenue.toLocaleString("en-IN")}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{analytics.total_orders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Products</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{analytics.total_products}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customers</span>
                <p className="text-2xl font-black text-gray-900 mt-1">{analytics.total_customers}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {analytics.low_stock_alerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Low Stock Inventory Alerts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.low_stock_alerts.map((item) => (
                  <div key={item.product_id} className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800">{item.title}</span>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {item.stock_quantity} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: INVENTORY & CATEGORIES ================= */}
      {activeTab === "products" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form Column */}
            <div className="space-y-6">
              {/* Add Product Form */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" /> Add New Product
                </h2>
                <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Product Title</label>
                    <input
                      required
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Mechanical Keyboard"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Category</label>
                    <select
                      required
                      value={newCatId}
                      onChange={(e) => setNewCatId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Description</label>
                    <textarea
                      required
                      rows={2}
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Product features and specifications..."
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Price (₹)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="2999"
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Stock</label>
                      <input
                        required
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        placeholder="25"
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Image URL</label>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20"
                  >
                    {submittingProduct ? "Saving..." : "Save Product"}
                  </button>
                </form>
              </div>

              {/* Add Category Form */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-indigo-600" /> Create New Category
                </h2>
                <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Category Name</label>
                    <input
                      required
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Wearables, Home Tech"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Short description"
                      className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingCategory}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm"
                  >
                    {submittingCategory ? "Creating..." : "Add Category"}
                  </button>
                </form>
              </div>
            </div>

            {/* Products List Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100 font-bold text-sm text-gray-900 flex justify-between items-center">
                <span>Live Catalog ({products.length})</span>
                <span className="text-xs text-gray-400 font-normal">Active items on storefront</span>
              </div>
              <div className="divide-y divide-gray-100">
                {products.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-900">{p.title}</h3>
                        {p.category && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md">
                            {p.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>₹{p.price.toLocaleString("en-IN")}</span>
                        <span>•</span>
                        <span className={p.stock_quantity < 5 ? "text-amber-600 font-bold" : "text-gray-600"}>
                          {p.stock_quantity} in stock
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                      title="Deactivate Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: ORDER MANAGEMENT ================= */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 font-bold text-sm text-gray-900">
            Customer Fulfillment Queue ({orders.length})
          </div>

          <div className="divide-y divide-gray-100">
            {orders.map((o) => (
              <div key={o.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-blue-600">Order #{o.id}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(o.created_at).toLocaleDateString()}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Ship to: {o.shipping_address}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Status:</span>
                    <select
                      value={o.status}
                      onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                      className="text-xs font-bold border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 focus:outline-none capitalize"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-3 space-y-1">
                  {o.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-700">
                      <span>{item.quantity}x {item.product.title}</span>
                      <span className="font-semibold">₹{(item.price_at_purchase * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between text-xs font-black text-gray-900">
                    <span>Total</span>
                    <span>₹{o.total_amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: CUSTOMERS DIRECTORY ================= */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 font-bold text-sm text-gray-900">
            Registered Customers ({customers.length})
          </div>

          <div className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No registered customers yet.</div>
            ) : (
              customers.map((c) => (
                <div key={c.id} className="p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{c.full_name}</h3>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full uppercase">
                      {c.role}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Joined {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}