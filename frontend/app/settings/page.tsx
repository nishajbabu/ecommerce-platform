"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User as UserIcon,
  Phone,
  MapPin,
  Package,
  Star,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ShieldCheck,
  ArrowRight,
  PackageOpen,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type {
  Product,
  ProductReview,
  UserAddress,
  UserProfile,
} from "@/lib/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

type SettingsTab = "profile" | "orders" | "addresses" | "reviews";
type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product: { id?: number; title: string; image_url?: string };
}

interface Order {
  id: number;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string;
  created_at: string;
  items: OrderItem[];
}

const PROGRESS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const initialTab = (searchParams.get("tab") as SettingsTab) || "profile";
  const [activeTab, setActiveTab] = React.useState<SettingsTab>(
    ["profile", "orders", "addresses", "reviews"].includes(initialTab)
      ? initialTab
      : "profile"
  );

  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [addresses, setAddresses] = React.useState<UserAddress[]>([]);
  const [myReviews, setMyReviews] = React.useState<ProductReview[]>([]);
  const [catalogProducts, setCatalogProducts] = React.useState<Product[]>([]);

  // Profile form state
  const [fullName, setFullName] = React.useState("");
  const [primaryPhone, setPrimaryPhone] = React.useState("");
  const [secondaryPhone, setSecondaryPhone] = React.useState("");
  const [savingProfile, setSavingProfile] = React.useState(false);

  // Order filter
  const [orderFilter, setOrderFilter] = React.useState<
    "all" | "active" | "delivered"
  >("all");

  // Address modal state
  const [showAddressModal, setShowAddressModal] = React.useState(false);
  const [editingAddress, setEditingAddress] =
    React.useState<UserAddress | null>(null);
  const [deletingAddress, setDeletingAddress] =
    React.useState<UserAddress | null>(null);
  const [savingAddress, setSavingAddress] = React.useState(false);
  const [addrForm, setAddrForm] = React.useState({
    label: "Home",
    recipient_name: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    postal_code: "",
    is_default: false,
  });

  // Review submission state
  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewTitle, setReviewTitle] = React.useState("");
  const [reviewComment, setReviewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const loadSettingsData = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const [meRes, ordRes, addrRes, revRes, prodRes] = await Promise.all([
        apiRequest<UserProfile>("/api/auth/me"),
        apiRequest<Order[]>("/api/orders/my-orders"),
        apiRequest<UserAddress[]>("/api/addresses"),
        apiRequest<ProductReview[]>("/api/reviews/my-reviews"),
        apiRequest<{ products: Product[] }>("/api/products?limit=50"),
      ]);

      setProfile(meRes);
      setFullName(meRes.full_name || "");
      setPrimaryPhone(meRes.phone || "");
      setSecondaryPhone(meRes.secondary_phone || "");

      setOrders(Array.isArray(ordRes) ? ordRes : []);
      setAddresses(Array.isArray(addrRes) ? addrRes : []);
      setMyReviews(Array.isArray(revRes) ? revRes : []);

      const prods = prodRes.products || [];
      setCatalogProducts(prods);
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(String(prods[0].id));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      toast({
        type: "error",
        title: "Load failed",
        description: "Could not load your account settings.",
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast, selectedProductId]);

  React.useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await apiRequest<UserProfile>("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: primaryPhone.trim() || null,
          secondary_phone: secondaryPhone.trim() || null,
        }),
      });
      setProfile(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      window.dispatchEvent(new Event("auth-updated"));
      toast({
        type: "success",
        title: "Profile updated",
        description: "Your profile and mobile numbers have been saved.",
      });
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Update failed",
        description:
          err instanceof Error ? err.message : "Could not save profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddrForm({
      label: "Home",
      recipient_name: profile?.full_name || "",
      phone: profile?.phone || "",
      address_line: "",
      city: "",
      state: "",
      postal_code: "",
      is_default: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr: UserAddress) => {
    setEditingAddress(addr);
    setAddrForm({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address_line: addr.address_line,
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      is_default: addr.is_default,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      if (editingAddress) {
        await apiRequest(`/api/addresses/${editingAddress.id}`, {
          method: "PUT",
          body: JSON.stringify(addrForm),
        });
        toast({
          type: "success",
          title: "Address updated",
          description: `"${addrForm.label}" shipping address updated.`,
        });
      } else {
        await apiRequest("/api/addresses", {
          method: "POST",
          body: JSON.stringify(addrForm),
        });
        toast({
          type: "success",
          title: "Address added",
          description: `"${addrForm.label}" added to your saved addresses.`,
        });
      }
      setShowAddressModal(false);
      loadSettingsData();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Save failed",
        description:
          err instanceof Error ? err.message : "Check address fields.",
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addr: UserAddress) => {
    try {
      await apiRequest(`/api/addresses/${addr.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_default: true }),
      });
      toast({
        type: "success",
        title: "Default address changed",
        description: `"${addr.label}" is now your primary shipping address.`,
      });
      loadSettingsData();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Action failed",
        description: err instanceof Error ? err.message : "Could not update.",
      });
    }
  };

  const handleConfirmDeleteAddress = async () => {
    if (!deletingAddress) return;
    try {
      await apiRequest(`/api/addresses/${deletingAddress.id}`, {
        method: "DELETE",
      });
      toast({
        type: "success",
        title: "Address removed",
        description: `"${deletingAddress.label}" deleted.`,
      });
      setDeletingAddress(null);
      loadSettingsData();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete.",
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    setSubmittingReview(true);
    try {
      await apiRequest(`/api/products/${selectedProductId}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          comment: reviewComment.trim(),
        }),
      });
      setReviewTitle("");
      setReviewComment("");
      toast({
        type: "success",
        title: "Review submitted",
        description: "Your rating and review are now live on the product page.",
      });
      loadSettingsData();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Submit failed",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await apiRequest(`/api/reviews/${reviewId}`, { method: "DELETE" });
      toast({
        type: "info",
        title: "Review deleted",
        description: "Your review has been removed.",
      });
      loadSettingsData();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete.",
      });
    }
  };

  const filteredOrders = React.useMemo(() => {
    if (orderFilter === "all") return orders;
    if (orderFilter === "active") {
      return orders.filter(
        (o) =>
          o.status === "pending" ||
          o.status === "processing" ||
          o.status === "shipped"
      );
    }
    return orders.filter((o) => o.status === "delivered");
  }, [orders, orderFilter]);

  const getOrderBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="warning">
            <Clock className="h-3 w-3" /> Order Placed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="ai">
            <Package className="h-3 w-3" /> Processing
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="neutral">
            <Truck className="h-3 w-3" /> Shipped
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" /> Delivered
          </Badge>
        );
      default:
        return (
          <Badge variant="danger">
            <XCircle className="h-3 w-3" /> Cancelled
          </Badge>
        );
    }
  };

  const navItems: {
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: "profile", label: "Profile & Phones", icon: UserIcon },
    { id: "orders", label: "Orders & Tracking", icon: Package, badge: orders.length },
    { id: "addresses", label: "Shipping Addresses", icon: MapPin, badge: addresses.length },
    { id: "reviews", label: "Ratings & Reviews", icon: Star, badge: myReviews.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Left Navigation Rail */}
        <aside className="w-full shrink-0 space-y-3 lg:w-60 lg:sticky lg:top-24">
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
        </aside>

        {/* Main Settings Workspace */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex flex-col gap-3 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                {activeTab === "profile"
                  ? "Profile & Contact Numbers"
                  : activeTab === "orders"
                  ? "Orders & Live Tracking"
                  : activeTab === "addresses"
                  ? "Saved Shipping Addresses"
                  : "Product Ratings & Reviews"}
              </h1>
              <p className="mt-0.5 text-xs text-zinc-500">
                Manage your personal details, mobile numbers, delivery locations, and feedback.
              </p>
            </div>

            {activeTab === "addresses" && (
              <Button onClick={openAddAddress}>
                <Plus className="h-4 w-4" />
                Add New Address
              </Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {/* TAB 1: PROFILE & UP TO 2 MOBILE NUMBERS */}
              {activeTab === "profile" && profile && (
                <form
                  onSubmit={handleSaveProfile}
                  className="max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
                >
                  <div className="flex items-center gap-4 border-b border-zinc-100 pb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-base font-semibold text-white dark:bg-white dark:text-zinc-950">
                      {profile.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        {profile.full_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{profile.email}</span>
                        <Badge variant="success">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      required
                      minLength={2}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                    />

                    <Input
                      label="Email Address (Account ID)"
                      disabled
                      value={profile.email}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                          <Phone className="h-3.5 w-3.5 text-zinc-400" />
                          Primary Mobile Number
                        </label>
                        <input
                          type="tel"
                          required
                          value={primaryPhone}
                          onChange={(e) => setPrimaryPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                            <Phone className="h-3.5 w-3.5 text-zinc-400" />
                            Secondary Mobile (Optional)
                          </label>
                          {secondaryPhone && (
                            <button
                              type="button"
                              onClick={() => setSecondaryPhone("")}
                              className="text-[11px] font-medium text-rose-600 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="tel"
                          value={secondaryPhone}
                          onChange={(e) => setSecondaryPhone(e.target.value)}
                          placeholder="Add alternate mobile number"
                          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-100 pt-5">
                    <p className="text-[11px] text-zinc-500">
                      Member since {formatDate(profile.created_at)} · Up to 2 mobile numbers supported
                    </p>
                    <Button type="submit" isLoading={savingProfile}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 2: ORDERS & ACTIVE TRACKING */}
              {activeTab === "orders" && (
                <div className="space-y-5">
                  <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 shadow-xs">
                    {(["all", "active", "delivered"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setOrderFilter(tab)}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer",
                          orderFilter === tab
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-600 hover:text-zinc-950"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center space-y-3 dark:border-zinc-700">
                      <Package className="mx-auto h-8 w-8 text-zinc-400" />
                      <p className="text-sm font-semibold text-zinc-950">
                        No matching orders
                      </p>
                      <Link href="/">
                        <Button size="sm">
                          Explore Catalog <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => {
                        const activeIdx = PROGRESS_STEPS.findIndex(
                          (s) => s.key === order.status
                        );
                        return (
                          <div
                            key={order.id}
                            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs"
                          >
                            <div className="flex flex-col gap-2 border-b border-zinc-100 bg-zinc-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-zinc-950">
                                    ORD-{order.id}
                                  </span>
                                  <span className="text-zinc-300">·</span>
                                  <span className="text-xs text-zinc-500">
                                    {formatDate(order.created_at)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-zinc-500">
                                  {order.shipping_address}
                                </p>
                              </div>
                              {getOrderBadge(order.status)}
                            </div>

                            {order.status !== "cancelled" && (
                              <div className="grid grid-cols-4 gap-2 border-b border-zinc-100 px-5 py-3.5">
                                {PROGRESS_STEPS.map((step, idx) => (
                                  <div key={step.key} className="space-y-1">
                                    <div
                                      className={cn(
                                        "h-1.5 rounded-full",
                                        idx <= activeIdx
                                          ? "bg-zinc-900 dark:bg-white"
                                          : "bg-zinc-200 dark:bg-zinc-800"
                                      )}
                                    />
                                    <p
                                      className={cn(
                                        "text-[11px] font-medium",
                                        idx <= activeIdx
                                          ? "text-zinc-950"
                                          : "text-zinc-400"
                                      )}
                                    >
                                      {step.label}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="divide-y divide-zinc-100 px-5">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 py-3 text-xs"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center shrink-0">
                                      {item.product.image_url ? (
                                        <img
                                          src={item.product.image_url}
                                          alt={item.product.title}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <PackageOpen className="h-4 w-4 text-zinc-400" />
                                      )}
                                    </div>
                                    <div>
                                      <Link
                                        href={`/products/${item.product_id}`}
                                        className="font-semibold text-zinc-950 hover:underline"
                                      >
                                        {item.product.title}
                                      </Link>
                                      <p className="font-mono text-[11px] text-zinc-500">
                                        {item.quantity} ×{" "}
                                        {formatCurrency(item.price_at_purchase)}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                                    {formatCurrency(
                                      item.price_at_purchase * item.quantity
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/40 px-5 py-3 text-xs">
                              <span className="font-medium text-zinc-500">
                                Order Total
                              </span>
                              <span className="font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                                {formatCurrency(order.total_amount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SHIPPING ADDRESSES CRUD */}
              {activeTab === "addresses" && (
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-14 text-center space-y-3 dark:border-zinc-700">
                      <MapPin className="mx-auto h-8 w-8 text-zinc-400" />
                      <h3 className="text-sm font-semibold text-zinc-950">
                        No saved shipping addresses
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Save your home or office addresses for 1-click checkout.
                      </p>
                      <Button size="sm" onClick={openAddAddress}>
                        <Plus className="h-3.5 w-3.5" />
                        Add Shipping Address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="neutral">{addr.label}</Badge>
                                {addr.is_default && (
                                  <Badge variant="success">Default</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditAddress(addr)}
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 cursor-pointer"
                                  title="Edit address"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingAddress(addr)}
                                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 cursor-pointer"
                                  title="Delete address"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="text-sm font-semibold text-zinc-950">
                              {addr.recipient_name}
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-600">
                              {addr.address_line}, {addr.city}, {addr.state} –{" "}
                              <span className="font-mono">{addr.postal_code}</span>
                            </p>
                            <p className="font-mono text-xs text-zinc-500">
                              Phone: {addr.phone}
                            </p>
                          </div>

                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr)}
                              className="self-start text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
                            >
                              Set as default address
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PRODUCT RATINGS & REVIEWS */}
              {activeTab === "reviews" && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
                  {/* Submit Rating & Review Card */}
                  <form
                    onSubmit={handleSubmitReview}
                    className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4"
                  >
                    <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                      Submit a Product Review
                    </h2>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700">
                        Select Product
                      </label>
                      <select
                        required
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
                      >
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({formatCurrency(p.price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-zinc-700">
                        Rating
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewRating(s)}
                            className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={cn(
                                "h-6 w-6",
                                s <= reviewRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-300 dark:text-zinc-700"
                              )}
                            />
                          </button>
                        ))}
                        <span className="ml-2 font-mono text-xs text-zinc-500">
                          {reviewRating}/5
                        </span>
                      </div>
                    </div>

                    <Input
                      label="Review Headline (Optional)"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Worth every rupee"
                    />

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700">
                        Your Review
                      </label>
                      <textarea
                        required
                        minLength={3}
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share what you liked or disliked..."
                        className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
                      />
                    </div>

                    <Button
                      type="submit"
                      isLoading={submittingReview}
                      className="w-full"
                    >
                      Publish Rating & Review
                    </Button>
                  </form>

                  {/* My Submitted Reviews List */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-base font-semibold tracking-tight text-zinc-950">
                      Your Submitted Reviews ({myReviews.length})
                    </h3>

                    {myReviews.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-xs text-zinc-500 dark:border-zinc-700">
                        You haven&apos;t reviewed any products yet. Submit a
                        rating on the left to help other shoppers.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myReviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link
                                  href={`/products/${rev.product_id}`}
                                  className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                  {rev.product_title || `Product #${rev.product_id}`}
                                </Link>
                                <p className="text-[11px] text-zinc-400">
                                  {formatDate(rev.created_at)}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
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
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="rounded p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                  title="Delete review"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add / Edit Shipping Address Modal */}
      <Modal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title={editingAddress ? "Edit Shipping Address" : "Add Shipping Address"}
        description="Saved addresses can be selected in 1 click during checkout."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Label
              </label>
              <select
                value={addrForm.label}
                onChange={(e) =>
                  setAddrForm({ ...addrForm, label: e.target.value })
                }
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:text-zinc-100"
              >
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input
              label="Recipient Name"
              required
              value={addrForm.recipient_name}
              onChange={(e) =>
                setAddrForm({ ...addrForm, recipient_name: e.target.value })
              }
              placeholder="Full name"
            />
          </div>

          <Input
            label="Contact Mobile Number"
            required
            type="tel"
            value={addrForm.phone}
            onChange={(e) =>
              setAddrForm({ ...addrForm, phone: e.target.value })
            }
            placeholder="+91 98765 43210"
          />

          <Input
            label="Street Address / Flat / Landmark"
            required
            minLength={5}
            value={addrForm.address_line}
            onChange={(e) =>
              setAddrForm({ ...addrForm, address_line: e.target.value })
            }
            placeholder="Flat 4B, Greenview Apartments, Indiranagar"
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              required
              value={addrForm.city}
              onChange={(e) =>
                setAddrForm({ ...addrForm, city: e.target.value })
              }
              placeholder="Bengaluru"
            />
            <Input
              label="State"
              required
              value={addrForm.state}
              onChange={(e) =>
                setAddrForm({ ...addrForm, state: e.target.value })
              }
              placeholder="Karnataka"
            />
            <Input
              label="PIN Code"
              required
              value={addrForm.postal_code}
              onChange={(e) =>
                setAddrForm({ ...addrForm, postal_code: e.target.value })
              }
              placeholder="560038"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
            <input
              type="checkbox"
              checked={addrForm.is_default}
              onChange={(e) =>
                setAddrForm({ ...addrForm, is_default: e.target.checked })
              }
              className="h-4 w-4 rounded border-zinc-300"
            />
            Set as default shipping address
          </label>

          <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddressModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={savingAddress}>
              {editingAddress ? "Save Address" : "Add Address"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Address Confirmation Modal */}
      <Modal
        open={!!deletingAddress}
        onClose={() => setDeletingAddress(null)}
        title="Delete Shipping Address"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-5">
          <p className="text-sm text-zinc-600">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-zinc-950">
              {deletingAddress?.label} ({deletingAddress?.city})
            </span>
            ?
          </p>
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setDeletingAddress(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDeleteAddress}>
              Delete Address
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}