"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";

function LoginContent() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "session_expired";

  const [isRegistering, setIsRegistering] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        window.location.href = user.role === "admin" ? "/admin" : "/";
        return;
      } catch {
        localStorage.clear();
      }
    }
    setCheckingAuth(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        setError("Please enter a valid 10 to 15-digit mobile number.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
            role: "customer",
          }),
        });
      }

      const res = await apiRequest<{
        access_token: string;
        user: {
          id: number;
          full_name: string;
          email: string;
          phone?: string;
          secondary_phone?: string;
          role: string;
        };
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      localStorage.setItem("token", res.access_token);
      localStorage.setItem("user", JSON.stringify(res.user));
      window.dispatchEvent(new Event("auth-updated"));

      window.location.href = res.user.role === "admin" ? "/admin" : "/";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-xs font-medium text-zinc-400">
        Verifying session...
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-12">
        {/* Left Brand Panel */}
        <div className="hidden lg:col-span-5 lg:flex flex-col justify-between bg-zinc-950 p-10 text-white">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-zinc-950">
                N
              </div>
              <span className="text-base font-semibold tracking-tight">
                NeuraShop
              </span>
            </Link>

            <div className="space-y-3 pt-4">
              <h2 className="text-2xl font-semibold tracking-tight leading-snug">
                Enterprise-grade tech commerce, built for speed.
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                Sign in to manage saved delivery addresses, track orders in
                real time, publish verified reviews, and chat with your AI
                shopping concierge.
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-6 text-xs text-zinc-300">
            <div className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-zinc-400" />
              <span>Real-time order & fulfillment tracking</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>JWT-secured account & protected checkout</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Live catalog recommendations</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-12 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                {isRegistering ? "Create your account" : "Sign in to NeuraShop"}
              </h1>
              <p className="text-sm text-zinc-500">
                {isRegistering
                  ? "Enter your details and mobile number to start shopping."
                  : "Enter your credentials to access your cart and settings."}
              </p>
            </div>

            {sessionExpired && !error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Your session expired. Please sign in again.</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        required
                        minLength={2}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-700">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                className="w-full mt-2"
              >
                {isRegistering ? "Create Account" : "Sign In"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="border-t border-zinc-100 pt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                }}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
              >
                {isRegistering ? (
                  <>
                    Already have an account?{" "}
                    <span className="font-semibold text-zinc-950 underline underline-offset-4">
                      Sign In
                    </span>
                  </>
                ) : (
                  <>
                    New to NeuraShop?{" "}
                    <span className="font-semibold text-zinc-950 underline underline-offset-4">
                      Create an account
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-xs text-zinc-400">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}