"use client";

import * as React from "react";
import { apiRequest } from "@/lib/api";

export interface AuthUser {
  id?: number | string;
  email?: string;
  full_name: string;
  role: "customer" | "admin" | string;
}

interface AuthContextValue {
  user: AuthUser | null;
  cartCount: number;
  refreshAuth: () => void;
  refreshCartCount: () => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [cartCount, setCartCount] = React.useState(0);

  const refreshAuth = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const refreshCartCount = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const data = await apiRequest<unknown>("/api/cart");
      const items = Array.isArray(data)
        ? data
        : (data as { items?: unknown[] })?.items || [];
      const totalQty = items.reduce(
        (sum: number, item: unknown) =>
          sum + ((item as { quantity?: number })?.quantity || 1),
        0
      );
      setCartCount(totalQty);
    } catch {
      // Silently ignore if cart endpoint returns empty/401
    }
  }, []);

  React.useEffect(() => {
    refreshAuth();
    refreshCartCount();

    const handleCartUpdated = () => refreshCartCount();
    const handleAuthUpdated = () => {
      refreshAuth();
      refreshCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("auth-updated", handleAuthUpdated);
    window.addEventListener("storage", handleAuthUpdated);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("auth-updated", handleAuthUpdated);
      window.removeEventListener("storage", handleAuthUpdated);
    };
  }, [refreshAuth, refreshCartCount]);

  const logout = React.useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setCartCount(0);
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, cartCount, refreshAuth, refreshCartCount, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}