"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MapPin,
  PackageOpen,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: number;
  quantity: number;
  price_at_purchase: number;
  product: { id?: number; title: string; image_url?: string };
}

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

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

export default function CustomerOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [requiresAuth, setRequiresAuth] = React.useState(false);
  const [filterTab, setFilterTab] = React.useState<
    "all" | "active" | "delivered" | "cancelled"
  >("all");

  React.useEffect(() => {
    async function loadOrders() {
      const token = localStorage.getItem("token");
      if (!token) {
        setRequiresAuth(true);
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest<Order[]>("/api/orders/my-orders");
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setRequiresAuth(true);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusBadge = (status: OrderStatus) => {
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
            <Truck className="h-3 w-3" /> Out for Delivery
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

  const filteredOrders = React.useMemo(() => {
    if (filterTab === "all") return orders;
    if (filterTab === "active") {
      return orders.filter(
        (o) =>
          o.status === "pending" ||
          o.status === "processing" ||
          o.status === "shipped"
      );
    }
    return orders.filter((o) => o.status === filterTab);
  }, [orders, filterTab]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Order History
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Track real-time fulfillment status and review past invoices.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 shadow-xs">
          {(["all", "active", "delivered", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer",
                filterTab === tab
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-950"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : requiresAuth ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
            <Package className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-950">
              Sign in to view your orders
            </h2>
            <p className="text-xs text-zinc-500">
              Track active shipments and review past invoices after signing in.
            </p>
          </div>
          <Link href="/login" className="inline-block pt-1">
            <Button>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <Package className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-950">
              {orders.length === 0
                ? "No orders placed yet"
                : `No ${filterTab} orders`}
            </h2>
            <p className="text-xs text-zinc-500">
              {orders.length === 0
                ? "Your completed purchases and live shipment tracking will appear here."
                : "Switch tabs to view your other orders."}
            </p>
          </div>
          {orders.length === 0 && (
            <Link href="/" className="inline-block pt-1">
              <Button>
                Explore Catalog
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const activeStepIndex = PROGRESS_STEPS.findIndex(
              (s) => s.key === order.status
            );

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs"
              >
                {/* Order Header */}
                <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-zinc-950">
                        ORD-{order.id}
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{order.shipping_address}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* 4-Step Fulfillment Bar (Hidden if cancelled) */}
                {order.status !== "cancelled" && (
                  <div className="border-b border-zinc-100 px-6 py-4">
                    <div className="grid grid-cols-4 gap-2">
                      {PROGRESS_STEPS.map((step, idx) => {
                        const completed = idx <= activeStepIndex;
                        return (
                          <div key={step.key} className="space-y-1.5">
                            <div
                              className={cn(
                                "h-1.5 w-full rounded-full transition-colors",
                                completed ? "bg-zinc-900" : "bg-zinc-200"
                              )}
                            />
                            <p
                              className={cn(
                                "text-[11px] font-medium",
                                completed ? "text-zinc-900" : "text-zinc-400"
                              )}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Order Line Items */}
                <div className="divide-y divide-zinc-100 px-6">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 py-3.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center">
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
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-zinc-900">
                            {item.product.title}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-500">
                            Qty: {item.quantity} ×{" "}
                            {formatCurrency(item.price_at_purchase)}
                          </p>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-semibold text-zinc-950 tabular-nums shrink-0">
                        {formatCurrency(item.price_at_purchase * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/40 px-6 py-3.5">
                  <span className="text-xs font-medium text-zinc-500">
                    Total Amount
                  </span>
                  <span className="font-mono text-base font-semibold text-zinc-950 tabular-nums">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}