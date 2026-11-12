// Centralized API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle Token Expiry / Unauthorized globally
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      // Clear expired credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // If user is currently trying to access admin or cart, redirect to login
      if (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/cart")) {
        window.location.href = "/login?reason=session_expired";
        return {} as T;
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    let errorMessage = `Request failed with status ${response.status}`;
    if (typeof errorData.detail === "string") {
      errorMessage = errorData.detail;
    } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
      errorMessage = errorData.detail[0].msg;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}