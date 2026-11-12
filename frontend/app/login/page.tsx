"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Lock, Mail, User as UserIcon, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 1. Guard: If already logged in, bounce out of the login screen immediately!
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "admin") {
          window.location.href = "/admin";
          return;
        } else {
          window.location.href = "/";
          return;
        }
      } catch {
        localStorage.clear();
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        // Register flow
        await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
            role: "customer",
          }),
        });
      }

      // Login flow
      const res = await apiRequest<{
        access_token: string;
        user: { id: number; full_name: string; email: string; role: string };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Save credentials cleanly
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));

      // Clean redirect: Admins go to /admin, Customers go to /
      if (res.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-gray-400">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-gray-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-gray-900">
            {isRegistering ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-gray-500">
            {isRegistering
              ? "Join NeuraShop to place orders and track delivery"
              : "Sign in to manage your orders and cart"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : isRegistering ? "Register Account" : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            {isRegistering
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}