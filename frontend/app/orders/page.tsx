"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Package, Clock, Truck, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface OrderItem {
  id: number;
  quantity: number;
  price_at_purchase: number;
  product: { title: string; image_url?: string };
}

interface Order {
  id: number;
  total_amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shipping_address: string;
  created_at: string;
  items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await apiRequest<Order[]>("/api/orders/my-orders");
        setOrders(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> Order Placed</span>;
      case "processing":
        return <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full"><Package className="w-3.5 h-3.5" /> Processing</span>;
      case "shipped":
        return <span className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full"><Truck className="w-3.5 h-3.5" /> Out for Delivery</span>;
      case "delivered":
        return <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Your Order History</h1>
        <p className="text-sm text-gray-500">Track shipments and view past receipts</p>
      </div>

      {loading ? (
        <div className="h-64 bg-white rounded-3xl animate-pulse border border-gray-200" />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">No orders placed yet</h2>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline">
            Explore Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                <div>
                  <span className="text-xs font-bold text-blue-600">Order #{o.id}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(o.created_at).toLocaleDateString()}</span>
                  <p className="text-xs text-gray-500 mt-1">Shipping to: {o.shipping_address}</p>
                </div>
                <div>{getStatusBadge(o.status)}</div>
              </div>

              <div className="divide-y divide-gray-50">
                {o.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800">{item.quantity}x {item.product.title}</span>
                    <span className="font-black text-gray-900">₹{(item.price_at_purchase * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className="text-gray-500 text-xs font-medium">Total Paid</span>
                <span className="font-black text-base text-gray-900">₹{o.total_amount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}