
import Constants from "expo-constants";
import { storage } from "@/src/utils/storage";

export type User = { user_id: string; name: string; email: string; created_at: string };
export type GalleryItem = { id: string; author: string; width: number; height: number; url: string; download_url: string; thumbnail_url: string };
export type GalleryResponse = { items: GalleryItem[]; page: number; limit: number; has_more: boolean };

const backendUrl = String(Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
export const TOKEN_KEY = "aura_session_tokens";

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const tokens = await storage.secureGet<{ access_token: string; refresh_token: string } | null>(TOKEN_KEY, null);
  const headers = { "Content-Type": "application/json", ...(options.headers || {}), ...(tokens?.access_token ? { Authorization: `Bearer ${tokens.access_token}` } : {}) };
  const response = await fetch(`${backendUrl}/api${path}`, { ...options, headers });
  if (response.status === 401 && retry && tokens?.refresh_token) {
    const refreshed = await fetch(`${backendUrl}/api/auth/refresh`, { method: "POST", headers: { Authorization: `Bearer ${tokens.refresh_token}` } });
    if (refreshed.ok) {
      const next = await refreshed.json();
      await storage.secureSet(TOKEN_KEY, { access_token: next.access_token, refresh_token: next.refresh_token });
      return request<T>(path, options, false);
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || "Something went wrong. Please try again.");
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) => request<{ access_token: string; refresh_token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false),
  register: (name: string, email: string, password: string) => request<{ access_token: string; refresh_token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }, false),
  me: () => request<User>("/auth/me"),
  forgotPassword: (email: string) => request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }, false),
  resetPassword: (token: string, password: string) => request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }, false),
  gallery: (page: number, signal?: AbortSignal) => request<GalleryResponse>(`/gallery?page=${page}&limit=30`, { signal }),
};
