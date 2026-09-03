import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("admin_refresh_token", refreshToken);
      }
      localStorage.setItem("admin_user", JSON.stringify(user));
    }
    set({
      user,
      accessToken,
      refreshToken: refreshToken || null,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      const refreshToken = get().refreshToken || (typeof window !== "undefined" ? localStorage.getItem("admin_refresh_token") : null);
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
        localStorage.removeItem("admin_user");
      }
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  initializeAuth: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_access_token");
      const refreshToken = localStorage.getItem("admin_refresh_token");
      const savedUser = localStorage.getItem("admin_user");

      if (token && savedUser) {
        try {
          const user = JSON.parse(savedUser);
          set({
            user,
            accessToken: token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch {
          localStorage.removeItem("admin_user");
        }
      }
    }
    set({ isLoading: false });
  },
}));
