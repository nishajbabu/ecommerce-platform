"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, User as UserIcon, Shield, LogOut } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            NeuraShop
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium transition">
            Store
          </Link>

          {/* Cart Icon */}
          <Link href="/cart" className="relative p-2 text-gray-600 hover:text-blue-600 transition">
            <ShoppingCart className="w-5 h-5" />
          </Link>

          {/* Conditional Admin Link */}
          {user && user.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </Link>
          )}

          {/* Auth State */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Hi, {user.full_name.split(" ")[0]}
              </span>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-gray-500 hover:text-red-600 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
            >
              <UserIcon className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}