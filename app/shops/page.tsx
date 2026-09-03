"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

interface Cuisine {
  id: number;
  name: string;
}

interface Shop {
  id: number;
  name: string;
  description?: string;
  cover_image_url?: string;
  address?: string;
  price_tier?: string;
  is_active: boolean;
  type?: "restaurant" | "shop";
  created_at: string;
  owner_name?: string;
  owner_email?: string;
  cuisines?: Cuisine[];
}

export default function AdminShopsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: shops = [], isLoading, isError, error } = useQuery<Shop[]>({
    queryKey: ["admin-shops", statusFilter, searchQuery],
    queryFn: () => {
      let url = "/admin/restaurants?type=shop";
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      return apiClient.get<Shop[]>(url);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/admin/restaurants/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shops"] });
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/restaurants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shops"] });
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
    },
  });

  const handleToggleActive = (shop: Shop) => {
    if (shop.is_active) {
      const confirmed = confirm(
        `Are you sure you want to BLOCK "${shop.name}"?\n\nBlocking this shop will hide it from customer mart & grocery listings.`
      );
      if (!confirmed) return;
    }
    toggleMutation.mutate(shop.id);
  };

  const handleDelete = (shop: Shop) => {
    const confirmed = confirm(
      `Are you sure you want to PERMANENTLY DELETE "${shop.name}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;
    deleteMutation.mutate(shop.id);
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Shop &amp; Grocery Approvals
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Audit mart, convenience store, and grocery partner onboarding applications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/restaurants"
              className="bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>🍔</span> Switch to Restaurants →
            </Link>
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shops by name..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50 transition-all"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "all"
                  ? "bg-[#2B1B0E] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "inactive"
                  ? "bg-amber-500 text-amber-950 font-bold shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ⏳ Pending ({shops.filter((s) => !s.is_active).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ● Active Live
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
              <div className="w-8 h-8 border-3 border-[#FCBA08] border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-medium">Fetching shop records...</span>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-600 text-xs">
              Failed to load shops: {(error as Error)?.message || "Server Error"}
            </div>
          ) : shops.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-purple-50 text-2xl flex items-center justify-center text-purple-600">
                🛒
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A]">No shops found</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                There are no shop records matching the current search &amp; filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Shop Name</th>
                    <th className="py-4 px-6">Categories Offered</th>
                    <th className="py-4 px-6">Owner Profile</th>
                    <th className="py-4 px-6">Registration Date</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {shops.map((shop) => (
                    <tr
                      key={shop.id}
                      className="hover:bg-purple-50/30 transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-4 px-6">
                        <Link
                          href={`/restaurants/${shop.id}`}
                          className="font-bold text-[#1A1A1A] hover:text-[#FCBA08] transition-colors text-sm flex items-center gap-2"
                        >
                          <span>{shop.name}</span>
                          <span className="text-gray-400 group-hover:translate-x-1 transition-transform">
                            →
                          </span>
                        </Link>
                        {shop.address && (
                          <div className="text-[11px] text-gray-400 font-normal truncate max-w-xs mt-0.5">
                            📍 {shop.address}
                          </div>
                        )}
                      </td>

                      {/* Shop Categories */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {shop.cuisines && shop.cuisines.length > 0 ? (
                            shop.cuisines.map((c) => (
                              <span
                                key={c.id}
                                className="bg-purple-50 text-purple-800 text-[10px] px-2.5 py-0.5 rounded-md font-semibold border border-purple-100"
                              >
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">Grocery Mart</span>
                          )}
                        </div>
                      </td>

                      {/* Owner Info */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {shop.owner_name || "N/A"}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {shop.owner_email || ""}
                          </span>
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {shop.created_at
                          ? new Date(shop.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"}
                      </td>

                      {/* Status Dot */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                            shop.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              shop.is_active ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {shop.is_active ? "Online & Active" : "Pending Approval"}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(shop)}
                            disabled={toggleMutation.isPending}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                              shop.is_active
                                ? "bg-gray-100 hover:bg-amber-100 text-gray-700 border border-gray-200"
                                : "bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-extrabold"
                            }`}
                          >
                            {toggleMutation.isPending
                              ? "Updating..."
                              : shop.is_active
                              ? "Block Shop"
                              : "Approve Shop ✓"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(shop)}
                            disabled={deleteMutation.isPending}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3 py-2 rounded-xl border border-red-200 transition-all"
                          >
                            Delete 🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
