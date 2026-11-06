// Centralized API Base URL (connects directly to our FastAPI backend)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Reusable fetch wrapper that automatically handles JSON and JWT tokens
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // If detail is an array (Pydantic validation error), extract the first message
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