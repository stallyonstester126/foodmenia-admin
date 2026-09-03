"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/lib/authStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post<{
        user?: { id: string | number; name: string; email: string; role?: string };
        tokens?: { accessToken?: string; refreshToken?: string };
        data?: {
          user?: { id: string | number; name: string; email: string; role?: string };
          tokens?: { accessToken?: string; refreshToken?: string };
          accessToken?: string;
          refreshToken?: string;
        };
        accessToken?: string;
        token?: string;
        refreshToken?: string;
      }>("/auth/login", { email, password });

      const user = res.user || res.data?.user;
      const accessToken =
        res.tokens?.accessToken ||
        res.accessToken ||
        res.token ||
        res.data?.tokens?.accessToken ||
        res.data?.accessToken;
      const refreshToken =
        res.tokens?.refreshToken ||
        res.refreshToken ||
        res.data?.tokens?.refreshToken ||
        res.data?.refreshToken;

      if (!accessToken || !user) {
        throw new Error("Authentication response missing access token.");
      }

      // Verify Admin Role
      if (user.role !== "admin") {
        setErrorMsg("Access Denied: Only platform administrators are permitted into this portal.");
        setLoading(false);
        return;
      }

      setAuth(
        {
          id: user.id,
          name: user.name || email.split("@")[0],
          email: user.email || email,
          role: user.role,
        },
        accessToken,
        refreshToken
      );

      router.push("/restaurants");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid admin credentials. Please try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 font-poppins select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 relative mb-1">
            <Image
              src="/logo.png"
              alt="FoodMenia Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-poppins text-2xl font-bold text-[#1A1A1A] tracking-tight">
            FoodMenia Admin Portal
          </h1>
          <p className="font-poppins text-xs text-gray-500">
            Internal Platform Management &amp; Approvals
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-poppins font-medium leading-relaxed">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-poppins text-xs font-semibold text-[#1A1A1A]">
              Admin Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@foodmenia.com"
              className="w-full rounded-xl border border-gray-200 bg-white p-3.5 font-poppins text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-poppins text-xs font-semibold text-[#1A1A1A]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 bg-white p-3.5 font-poppins text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-poppins font-bold text-sm py-4 rounded-xl transition-all shadow-md mt-2 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Admin Panel →"}
          </button>
        </form>

        <div className="text-center border-t border-gray-100 pt-4">
          <span className="font-poppins text-[11px] text-gray-400">
            Authorized Personnel Only • FoodMenia Systems
          </span>
        </div>
      </div>
    </div>
  );
}
