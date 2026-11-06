"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { Trash2, ShoppingBag, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    title: string;
    price: number;
    image_url?: string;
  };
}

interface CartData {
  items: CartItem[];
  total_items: number;
  subtotal: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    setLoading(true);
    try {
      const data = await apiRequest<CartData>("/api/cart");
      setCart(data);
    } catch (err: any) {
      console.error(err);
      setError("Please sign in to view your cart");
    } finally {
      setLoading(false);
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      await apiRequest(`/api/cart/${itemId}`, { method: "DELETE" });
      loadCart();
    } catch (err: any) {
      alert(err.message || "Could not remove item");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError("Please provide a valid shipping address");
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const order = await apiRequest("/api/orders/checkout", {
        method: "POST",
        body: JSON.stringify({ shipping_address: shippingAddress }),
      });
      setOrderConfirmed(order);
      setCart(null);
    } catch (err: any) {
      setError(err.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Order Placed Successfully!</h1>
        <p className="text-gray-500 text-sm">
          Your order <strong className="text-gray-900">#{orderConfirmed.id}</strong> has been received and is currently{" "}
          <span className="capitalize font-semibold text-blue-600">{orderConfirmed.status}</span>.
        </p>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping Address:</span>
            <span className="font-semibold text-gray-800">{orderConfirmed.shipping_address}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Paid:</span>
            <span className="font-bold text-gray-900">₹{orderConfirmed.total_amount.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition"
        >
          Continue Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-3xl font-black text-gray-900">Your Shopping Cart</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          {error.includes("sign in") && (
            <Link href="/login" className="ml-auto underline font-bold">
              Sign In Now
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="h-48 bg-white rounded-3xl animate-pulse border border-gray-200" />
      ) : !cart || cart.items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 space-y-4">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">Your cart is empty</h2>
          <p className="text-sm text-gray-500">Discover great products and add them to your cart.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 gap-4"
              >
                <div className="flex items-center gap-4">
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.title}
                      className="w-16 h-16 object-cover rounded-xl bg-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400">
                      No Img
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{item.product.title}</h3>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    <p className="text-sm font-black text-gray-900 mt-1">
                      ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Checkout Box */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items ({cart.total_items})</span>
                <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="text-emerald-600 font-bold uppercase text-xs">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-base text-gray-900">
                <span>Total Amount</span>
                <span>₹{cart.subtotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Delivery Address
                </label>
                <textarea
                  required
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street, Landmark, City, State, PIN"
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>

              <button
                type="submit"
                disabled={checkingOut}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {checkingOut ? "Processing Order..." : "Confirm & Place Order"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}