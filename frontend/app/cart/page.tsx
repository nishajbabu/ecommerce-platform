"use client";

import * as React from "react";
import Link from "next/link";
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  PackageOpen,
  MapPin,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { UserAddress } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    id?: number;
    title: string;
    price: number;
    stock_quantity?: number;
    image_url?: string;
  };
}

interface CartData {
  items: CartItem[];
  total_items: number;
  subtotal: number;
}

interface ConfirmedOrder {
  id: number;
  status: string;
  shipping_address: string;
  total_amount: number;
}

function formatAddressString(addr: UserAddress): string {
  return `${addr.recipient_name} (${addr.phone}) - ${addr.address_line}, ${addr.city}, ${addr.state} - ${addr.postal_code}`;
}

export default function CartPage() {
  const { toast } = useToast();
  const [cart, setCart] = React.useState<CartData | null>(null);
  const [savedAddresses, setSavedAddresses] = React.useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<
    number | "custom"
  >("custom");
  const [shippingAddress, setShippingAddress] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [mutatingId, setMutatingId] = React.useState<number | null>(null);
  const [clearing, setClearing] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [orderConfirmed, setOrderConfirmed] =
    React.useState<ConfirmedOrder | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadCartAndAddresses = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setError("Please sign in to view your cart.");
      return;
    }

    try {
      const [cartData, addrData] = await Promise.all([
        apiRequest<CartData>("/api/cart"),
        apiRequest<UserAddress[]>("/api/addresses").catch(() => []),
      ]);
      setCart(cartData);
      const addrs = Array.isArray(addrData) ? addrData : [];
      setSavedAddresses(addrs);

      if (addrs.length > 0) {
        const def = addrs.find((a) => a.is_default) || addrs[0];
        setSelectedAddressId(def.id);
        setShippingAddress(formatAddressString(def));
      }

      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Could not load your cart."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCartAndAddresses();
  }, [loadCartAndAddresses]);

  const syncCartNavbar = () => {
    window.dispatchEvent(new Event("cart-updated"));
  };

  const handleUpdateQuantity = async (item: CartItem, nextQty: number) => {
    if (nextQty < 1) return;
    if (
      item.product.stock_quantity !== undefined &&
      nextQty > item.product.stock_quantity
    ) {
      toast({
        type: "info",
        title: "Stock limit reached",
        description: `Only ${item.product.stock_quantity} units available.`,
      });
      return;
    }

    setMutatingId(item.id);
    try {
      await apiRequest(`/api/cart/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: nextQty }),
      });
      await loadCartAndAddresses();
      syncCartNavbar();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Update failed",
        description:
          err instanceof Error ? err.message : "Could not update quantity.",
      });
    } finally {
      setMutatingId(null);
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    setMutatingId(item.id);
    try {
      await apiRequest(`/api/cart/${item.id}`, { method: "DELETE" });
      await loadCartAndAddresses();
      syncCartNavbar();
      toast({
        type: "success",
        title: "Item removed",
        description: `${item.product.title} was removed from your cart.`,
      });
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Removal failed",
        description:
          err instanceof Error ? err.message : "Could not remove item.",
      });
    } finally {
      setMutatingId(null);
    }
  };

  const handleClearCart = async () => {
    setClearing(true);
    try {
      await apiRequest("/api/cart", { method: "DELETE" });
      await loadCartAndAddresses();
      syncCartNavbar();
      toast({
        type: "info",
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Clear cart failed",
        description:
          err instanceof Error ? err.message : "Could not clear cart.",
      });
    } finally {
      setClearing(false);
    }
  };

  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setShippingAddress(formatAddressString(addr));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim() || shippingAddress.trim().length < 10) {
      setError("Please select or enter a complete shipping address.");
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const order = await apiRequest<ConfirmedOrder>("/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify({ shipping_address: shippingAddress.trim() }),
      });
      setOrderConfirmed(order);
      setCart(null);
      syncCartNavbar();
      toast({
        type: "success",
        title: "Order confirmed",
        description: `Order #${order.id} has been placed.`,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="space-y-1.5">
            <p className="font-mono text-xs font-medium uppercase tracking-wider text-emerald-600">
              Payment & Order Confirmed
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Thank you for your order
            </h1>
            <p className="text-sm text-zinc-500">
              Order{" "}
              <span className="font-mono font-semibold text-zinc-900">
                #{orderConfirmed.id}
              </span>{" "}
              is confirmed and currently{" "}
              <span className="capitalize font-medium text-zinc-900">
                {orderConfirmed.status}
              </span>
              .
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-left space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Shipping Address</span>
              <span className="text-right font-medium text-zinc-900">
                {orderConfirmed.shipping_address}
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-200/70 pt-2.5">
              <span className="text-zinc-500">Total Paid</span>
              <span className="font-mono font-semibold text-zinc-950 tabular-nums">
                {formatCurrency(orderConfirmed.total_amount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                Track My Order
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="primary" className="w-full">
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Shopping Cart
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Adjust item quantities and confirm your delivery details.
          </p>
        </div>

        {cart && cart.items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            isLoading={clearing}
            onClick={handleClearCart}
            className="text-zinc-500 hover:text-rose-600 self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Cart
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          {error.toLowerCase().includes("sign in") && (
            <Link
              href="/login"
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Sign In
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
          <Skeleton className="lg:col-span-4 h-80 w-full rounded-2xl" />
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-20 px-6 text-center space-y-4 dark:border-zinc-700">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-950">
              Your cart is empty
            </h2>
            <p className="text-xs text-zinc-500">
              Explore our catalog and add hardware to get started.
            </p>
          </div>
          <Link href="/" className="inline-block pt-1">
            <Button>
              Browse Catalog
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Cart Items */}
          <div className="lg:col-span-8 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-xs">
            {cart.items.map((item) => {
              const isMutating = mutatingId === item.id;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Link
                      href={`/products/${item.product_id}`}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 flex items-center justify-center"
                    >
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <PackageOpen className="h-6 w-6 text-zinc-400" />
                      )}
                    </Link>

                    <div className="min-w-0 space-y-1">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="block truncate text-sm font-semibold text-zinc-950 hover:underline"
                      >
                        {item.product.title}
                      </Link>
                      <p className="font-mono text-xs text-zinc-500 tabular-nums">
                        {formatCurrency(item.product.price)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    {/* Quantity Stepper */}
                    <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
                      <button
                        type="button"
                        disabled={isMutating || item.quantity <= 1}
                        onClick={() =>
                          handleUpdateQuantity(item, item.quantity - 1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-700 hover:bg-white disabled:opacity-40 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-xs font-semibold text-zinc-950 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={
                          isMutating ||
                          (item.product.stock_quantity !== undefined &&
                            item.quantity >= item.product.stock_quantity)
                        }
                        onClick={() =>
                          handleUpdateQuantity(item, item.quantity + 1)
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-700 hover:bg-white disabled:opacity-40 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="w-24 text-right font-mono text-sm font-semibold text-zinc-950 tabular-nums">
                      {formatCurrency(item.product.price * item.quantity)}
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => handleRemoveItem(item)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/15 transition-colors disabled:opacity-40 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary & Checkout Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm border-b border-zinc-100 pb-5">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal ({cart.total_items} items)</span>
                <span className="font-mono text-zinc-900 tabular-nums">
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Express Shipping</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Free
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold text-zinc-950">
                <span>Total</span>
                <span className="font-mono tabular-nums">
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              {/* Saved Addresses Picker */}
              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-700">
                      Saved Addresses
                    </span>
                    <Link
                      href="/settings?tab=addresses"
                      className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Manage
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => {
                      const active = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={cn(
                            "w-full rounded-xl border p-3 text-left text-xs transition-all cursor-pointer",
                            active
                              ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 dark:border-white dark:ring-white"
                              : "border-zinc-200 hover:border-zinc-300"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 font-semibold text-zinc-950">
                              <MapPin className="h-3 w-3" />
                              {addr.label} · {addr.recipient_name}
                            </span>
                            {addr.is_default && (
                              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500">
                            {addr.address_line}, {addr.city}, {addr.state} –{" "}
                            {addr.postal_code}
                          </p>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId("custom");
                        setShippingAddress("");
                      }}
                      className={cn(
                        "w-full rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                        selectedAddressId === "custom"
                          ? "border-zinc-900 text-zinc-950 dark:border-white"
                          : "border-zinc-300 text-zinc-500 hover:text-zinc-900 dark:border-zinc-700"
                      )}
                    >
                      + Use a different delivery address
                    </button>
                  </div>
                </div>
              )}

              {(savedAddresses.length === 0 ||
                selectedAddressId === "custom") && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-zinc-700">
                      Delivery Address
                    </label>
                    {savedAddresses.length === 0 && (
                      <Link
                        href="/settings?tab=addresses"
                        className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Save in Settings →
                      </Link>
                    )}
                  </div>
                  <textarea
                    required
                    minLength={10}
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="House/Flat No, Street, Landmark, City, State, PIN"
                    className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:text-zinc-100"
                  />
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                isLoading={checkingOut}
                className="w-full"
              >
                Place Order · {formatCurrency(cart.subtotal)}
                {!checkingOut && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="space-y-2 border-t border-zinc-100 pt-4 text-[11px] text-zinc-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Encrypted checkout & verified stock allocation</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                <span>Tracked dispatch within 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}