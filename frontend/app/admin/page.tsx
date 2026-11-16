"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Package,
  LayoutDashboard,
  Search,
  ShieldAlert,
  PackageOpen,
  RefreshCw,
  FolderPlus,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import AdminAnalyticsCharts, {
  type AdminOrder,
} from "@/components/admin/AdminAnalyticsCharts";
import ProductFormModal, {
  type AdminProduct,
} from "@/components/admin/ProductFormModal";

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

interface Customer {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

type AdminTab = "overview" | "products" | "orders" | "customers";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [authorized, setAuthorized] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<AdminTab>("overview");
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
  const [products, setProducts] = React.useState<AdminProduct[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters & Search
  const [productSearch, setProductSearch] = React.useState("");
  const [orderStatusFilter, setOrderStatusFilter] = React.useState("all");
  const [customerSearch, setCustomerSearch] = React.useState("");

  // Modals
  const [showProductModal, setShowProductModal] = React.useState(false);
  const [editingProduct, setEditingProduct] =
    React.useState<AdminProduct | null>(null);
  const [deletingProduct, setDeletingProduct] =
    React.useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Standalone Category Modal
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatDesc, setNewCatDesc] = React.useState("");
  const [submittingCategory, setSubmittingCategory] = React.useState(false);

  const loadDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [anaRes, prodRes, catRes, ordRes, custRes] = await Promise.all([
        apiRequest<AnalyticsData>("/api/admin/analytics"),
        apiRequest<{ products: AdminProduct[] }>("/api/products?limit=50"),
        apiRequest<Category[]>("/api/categories"),
        apiRequest<AdminOrder[]>("/api/orders"),
        apiRequest<Customer[]>("/api/admin/customers"),
      ]);
      setAnalytics(anaRes);
      setProducts(prodRes.products || []);
      setCategories(Array.isArray(catRes) ? catRes : []);
      setOrders(Array.isArray(ordRes) ? ordRes : []);
      setCustomers(Array.isArray(custRes) ? custRes : []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      toast({
        type: "error",
        title: "Sync failed",
        description: "Could not refresh operations metrics.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== "admin") {
        toast({
          type: "error",
          title: "Access Denied",
          description: "Admin privileges are required to view this console.",
        });
        router.push("/");
        return;
      }
      setAuthorized(true);
      loadDashboardData();
    } catch {
      router.push("/login");
    }
  }, [router, loadDashboardData, toast]);

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await apiRequest(`/api/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      toast({
        type: "success",
        title: "Product deactivated",
        description: `"${deletingProduct.title}" has been removed.`,
      });
      setDeletingProduct(null);
      loadDashboardData();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Delete failed",
        description:
          err instanceof Error ? err.message : "Could not delete product.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSubmittingCategory(true);
    try {
      await apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim() || undefined,
        }),
      });
      toast({
        type: "success",
        title: "Category created",
        description: `"${newCatName.trim()}" added to catalog categories.`,
      });
      setNewCatName("");
      setNewCatDesc("");
      setShowCategoryModal(false);
      loadDashboardData();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Category creation failed",
        description:
          err instanceof Error ? err.message : "Could not create category.",
      });
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    newStatus: string
  ) => {
    try {
      await apiRequest(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast({
        type: "success",
        title: "Order status updated",
        description: `ORD-${orderId} updated to ${newStatus}.`,
      });
      loadDashboardData();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Update failed",
        description:
          err instanceof Error ? err.message : "Could not update status.",
      });
    }
  };

  const handleQuickRestock = (productId: number) => {
    const found = products.find((p) => p.id === productId);
    if (found) {
      setEditingProduct(found);
      setShowProductModal(true);
    } else {
      setActiveTab("products");
    }
  };

  const filteredProducts = React.useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q));
  }, [products, productSearch]);

  const filteredOrders = React.useMemo(() => {
    if (orderStatusFilter === "all") return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const filteredCustomers = React.useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const getCategoryName = (product: AdminProduct) =>
    product.category?.name ||
    categories.find((c) => c.id === product.category_id)?.name ||
    "General";

  if (!authorized) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 text-zinc-400">
        <ShieldAlert className="h-7 w-7 animate-pulse text-zinc-700" />
        <p className="text-xs font-medium">Verifying admin credentials...</p>
      </div>
    );
  }

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "products",
      label: "Inventory",
      icon: Package,
      badge: products.length,
    },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: orders.length },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      badge: customers.length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left Operations Rail */}
        <aside className="w-full shrink-0 space-y-3 lg:w-56 lg:sticky lg:top-20">
          <div className="flex flex-row gap-1.5 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-xs lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-zinc-100 text-zinc-500"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
            Sync Live Data
          </button>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                {activeTab === "overview"
                  ? "Operations Overview"
                  : activeTab === "products"
                  ? "Inventory Management"
                  : activeTab === "orders"
                  ? "Order Fulfillment"
                  : "Customer Directory"}
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                Monitor revenue in INR, control live inventory, and manage
                fulfillment.
              </p>
            </div>

            {activeTab === "products" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCategoryModal(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                  New Category
                </Button>
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-28 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && analytics && (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                        <span>Total Revenue</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <IndianRupee className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="font-mono text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                        {formatCurrency(analytics.total_revenue)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                        <span>Total Orders</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="font-mono text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                        {analytics.total_orders}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                        <span>Active Products</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                          <Package className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="font-mono text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                        {analytics.total_products}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                        <span>Customers</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                          <Users className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="font-mono text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">
                        {analytics.total_customers}
                      </p>
                    </div>
                  </div>

                  {/* Interactive SVG Charts */}
                  <AdminAnalyticsCharts orders={orders} />

                  {/* Low Stock Alerts */}
                  {analytics.low_stock_alerts &&
                    analytics.low_stock_alerts.length > 0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Low Stock Inventory Alerts (
                            {analytics.low_stock_alerts.length})
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {analytics.low_stock_alerts.map((item) => (
                            <div
                              key={item.product_id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-white px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-zinc-900">
                                  {item.title}
                                </p>
                                <p className="font-mono text-[11px] font-medium text-rose-600">
                                  {item.stock_quantity} left ·{" "}
                                  {formatCurrency(item.price)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickRestock(item.product_id)
                                }
                                className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-800 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer"
                              >
                                Restock
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* PRODUCTS TAB */}
              {activeTab === "products" && (
                <div className="space-y-4">
                  <div className="relative max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search inventory by title..."
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <tr>
                            <th className="px-5 py-3.5">Product</th>
                            <th className="px-5 py-3.5">Category</th>
                            <th className="px-5 py-3.5">Price</th>
                            <th className="px-5 py-3.5">Stock</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {filteredProducts.map((p) => (
                            <tr
                              key={p.id}
                              className="hover:bg-zinc-50/60 transition-colors"
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                                    {p.image_url ? (
                                      <img
                                        src={p.image_url}
                                        alt={p.title}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <PackageOpen className="h-4 w-4 text-zinc-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-zinc-950 truncate max-w-xs">
                                      {p.title}
                                    </p>
                                    <p className="font-mono text-[10px] text-zinc-400">
                                      SKU-{p.id}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-zinc-600">
                                {getCategoryName(p)}
                              </td>
                              <td className="px-5 py-3.5 font-mono font-semibold text-zinc-950 tabular-nums">
                                {formatCurrency(p.price)}
                              </td>
                              <td className="px-5 py-3.5">
                                {p.stock_quantity <= 0 ? (
                                  <Badge variant="danger">Out of stock</Badge>
                                ) : p.stock_quantity < 10 ? (
                                  <Badge variant="warning">
                                    {p.stock_quantity} left
                                  </Badge>
                                ) : (
                                  <Badge variant="success">
                                    {p.stock_quantity} units
                                  </Badge>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setShowProductModal(true);
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer"
                                  title="Edit product"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingProduct(p)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "all",
                      "pending",
                      "processing",
                      "shipped",
                      "delivered",
                      "cancelled",
                    ].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setOrderStatusFilter(status)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer",
                          orderStatusFilter === status
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          <tr>
                            <th className="px-5 py-3.5">Order</th>
                            <th className="px-5 py-3.5">Items</th>
                            <th className="px-5 py-3.5">Shipping Address</th>
                            <th className="px-5 py-3.5">Total</th>
                            <th className="px-5 py-3.5">Fulfillment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {filteredOrders.map((o) => (
                            <tr
                              key={o.id}
                              className="hover:bg-zinc-50/60 transition-colors align-top"
                            >
                              <td className="px-5 py-4 whitespace-nowrap">
                                <p className="font-mono font-semibold text-zinc-950">
                                  ORD-{o.id}
                                </p>
                                <p className="text-[11px] text-zinc-400 mt-0.5">
                                  {formatDate(o.created_at)}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  {o.items?.map((item) => (
                                    <p
                                      key={item.id}
                                      className="text-zinc-700 font-medium"
                                    >
                                      <span className="font-mono text-zinc-500">
                                        {item.quantity}×
                                      </span>{" "}
                                      {item.product?.title || "Item"}
                                    </p>
                                  ))}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-zinc-600 max-w-xs">
                                {o.shipping_address}
                              </td>
                              <td className="px-5 py-4 font-mono font-semibold text-zinc-950 tabular-nums whitespace-nowrap">
                                {formatCurrency(o.total_amount)}
                              </td>
                              <td className="px-5 py-4">
                                <select
                                  value={o.status}
                                  onChange={(e) =>
                                    handleUpdateOrderStatus(
                                      o.id,
                                      e.target.value
                                    )
                                  }
                                  className="h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none cursor-pointer"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOMERS TAB */}
              {activeTab === "customers" && (
                <div className="space-y-4">
                  <div className="relative max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search customers by name or email..."
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none"
                    />
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-12 text-center text-xs text-zinc-400">
                        No registered customers found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="px-5 py-3.5">Customer</th>
                              <th className="px-5 py-3.5">Email</th>
                              <th className="px-5 py-3.5">Role</th>
                              <th className="px-5 py-3.5 text-right">Joined</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {filteredCustomers.map((c) => (
                              <tr
                                key={c.id}
                                className="hover:bg-zinc-50/60 transition-colors"
                              >
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
                                      {c.full_name?.charAt(0).toUpperCase() ||
                                        "C"}
                                    </div>
                                    <span className="font-semibold text-zinc-950">
                                      {c.full_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-zinc-600">
                                  {c.email}
                                </td>
                                <td className="px-5 py-3.5">
                                  <Badge
                                    variant={
                                      c.role === "admin" ? "ai" : "success"
                                    }
                                  >
                                    {c.role}
                                  </Badge>
                                </td>
                                <td className="px-5 py-3.5 text-right font-mono text-zinc-500">
                                  {formatDate(c.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      <ProductFormModal
        open={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
        categories={categories}
        onSaved={loadDashboardData}
        onCategoryCreated={loadDashboardData}
      />

      {/* Standalone New Category Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Create New Category"
        description="Organize your storefront catalog into clear sections."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Wearables, Audio & Sound"
          />
          <Input
            label="Description (Optional)"
            value={newCatDesc}
            onChange={(e) => setNewCatDesc(e.target.value)}
            placeholder="Short summary for internal reference"
          />
          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={submittingCategory}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Deactivate Product"
        description="This action removes the product from the live storefront."
        maxWidthClass="max-w-md"
      >
        <div className="space-y-5">
          <p className="text-sm text-zinc-600">
            Are you sure you want to deactivate{" "}
            <span className="font-semibold text-zinc-950">
              {deletingProduct?.title}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setDeletingProduct(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleting}
              onClick={handleConfirmDelete}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}