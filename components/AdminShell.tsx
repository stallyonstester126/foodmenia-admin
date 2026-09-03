"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, initializeAuth, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== "admin") {
        router.push("/login?error=unauthorized");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#FCBA08] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-poppins text-sm text-gray-500 font-medium">
          Loading Admin Control Center...
        </span>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", href: "/", icon: "📊" },
    { label: "Restaurants", href: "/restaurants", icon: "🍔" },
    { label: "Shops", href: "/shops", icon: "🛒" },
    { label: "Vouchers", href: "/vouchers", icon: "🎟️" },
    { label: "Users", href: "/users", icon: "👥" },
    { label: "Tax & Fee", href: "/tax-fee", icon: "💰" },
    { label: "Orders Analytics", href: "/orders-analytics", icon: "📈" },
    { label: "Riders", href: "/riders", icon: "🛵" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] flex select-none font-poppins relative">
      {/* MOBILE DRAWER OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* PERSISTENT SIDEBAR */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-[260px] bg-[#1A1A1A] text-white flex flex-col justify-between p-5 flex-shrink-0 min-h-screen border-r border-gray-800 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 px-2 py-3 mb-6">
            <div className="w-9 h-9 relative">
              <Image
                src="/logo.png"
                alt="foodmenia logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-poppins text-2xl font-bold tracking-tight">
              <span className="text-white">food</span>
              <span className="text-[#FCBA08]">menia</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                    isActive
                      ? "bg-[#FCBA08] text-[#2B1B0E] font-bold shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-4 pt-4 border-t border-gray-800">
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image
                src="/menusticker.png"
                alt="Sloth Mascot"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-[#FCBA08] font-mono font-semibold uppercase">
                Platform Admin
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-medium text-xs w-full"
          >
            <span className="text-base">🚪</span>
            <span>Logout Session</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT SHELL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="h-[72px] bg-white border-b border-gray-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg bg-gray-100"
            >
              ☰
            </button>

            {/* Search Input */}
            <div className="relative w-48 sm:w-80">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, shops, users..."
                className="w-full bg-gray-100/80 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50 transition-all"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 flex items-center justify-center text-gray-600 transition-all relative"
            >
              <span className="text-base">🔔</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FCBA08]" />
            </button>

            {/* Admin Profile Pill */}
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
              <div className="w-9 h-9 rounded-full bg-[#FCBA08] text-[#2B1B0E] font-bold flex items-center justify-center text-xs border border-white shadow-xs">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-gray-900 leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
