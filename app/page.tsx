"use client";

import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { showAdminConfirm } from "@/lib/adminDialogStore";

interface Venue {
  id: number;
  name: string;
  type?: "restaurant" | "shop";
  address?: string;
  is_active: boolean;
  created_at?: string;
  owner_name?: string;
  owner_email?: string;
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();

  const { data: venues = [], isLoading } = useQuery<Venue[]>({
    queryKey: ["admin-restaurants"],
    queryFn: () => apiClient.get<Venue[]>("/admin/restaurants"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/admin/restaurants/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/restaurants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
    },
  });

  const pendingVenues = venues.filter((v) => !v.is_active);
  const activeRestaurants = venues.filter((v) => v.is_active && (v.type === "restaurant" || !v.type));
  const activeShops = venues.filter((v) => v.is_active && v.type === "shop");

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Platform Control Center
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Overview of onboarding approvals, active restaurants, active shops, and platform status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/restaurants"
              className="bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>🍔</span> Manage Restaurants →
            </Link>
            <Link
              href="/shops"
              className="bg-[#2B1B0E] hover:bg-black text-[#FCBA08] font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>🛒</span> Manage Shops →
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Pending Approvals
              </span>
              <span className="block font-bold text-2xl text-amber-600 mt-1">
                {pendingVenues.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
              ⏳
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Active Restaurants
              </span>
              <span className="block font-bold text-2xl text-orange-600 mt-1">
                {activeRestaurants.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl font-bold">
              🍔
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Active Shops
              </span>
              <span className="block font-bold text-2xl text-purple-600 mt-1">
                {activeShops.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
              🛒
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Total Venues
              </span>
              <span className="block font-bold text-2xl text-gray-900 mt-1">
                {venues.length}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-xl font-bold">
              📊
            </div>
          </div>
        </div>

        {/* Quick Action Navigation Banner */}
        <div className="bg-gradient-to-r from-[#2B1B0E] to-[#422a18] rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#FCBA08] text-[#2B1B0E] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Direct Management
              </span>
              <span className="text-xs text-amber-200/80 font-medium">
                Restaurant &amp; Shop Portal
              </span>
            </div>
            <h3 className="font-bold text-lg text-white">
              Vendor Onboarding &amp; Approval Center
            </h3>
            <p className="text-xs text-gray-300 max-w-xl">
              Audited venues can be instantly toggled live or blocked. Separate controls are available for restaurant kitchens and retail shops.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/restaurants"
              className="bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span>🍔</span> Restaurants ({venues.filter((v) => v.type !== "shop").length})
            </Link>
            <Link
              href="/shops"
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-xl border border-white/20 transition-all shadow-sm flex items-center gap-2"
            >
              <span>🛒</span> Shops ({venues.filter((v) => v.type === "shop").length})
            </Link>
          </div>
        </div>

        {/* Pending Approvals Table Section */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col gap-0">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                <span>⏳</span> Pending Onboarding Applications ({pendingVenues.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Submitted partner applications requiring admin review and approval before going live.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-gray-400 text-xs flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-[#FCBA08] border-t-transparent rounded-full animate-spin mb-2" />
              Checking application queue...
            </div>
          ) : pendingVenues.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
              <span className="text-3xl">🎉</span>
              <span className="font-semibold text-gray-700">No pending approvals!</span>
              <span className="text-gray-400">All submitted venues have been audited and updated.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Venue Name</th>
                    <th className="py-3.5 px-6">Type</th>
                    <th className="py-3.5 px-6">Owner Info</th>
                    <th className="py-3.5 px-6">Submitted Date</th>
                    <th className="py-3.5 px-6 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {pendingVenues.map((venue) => (
                    <tr key={venue.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <Link
                          href={`/restaurants/${venue.id}`}
                          className="font-bold text-[#1A1A1A] hover:text-[#FCBA08] transition-colors text-sm"
                        >
                          {venue.name}
                        </Link>
                        {venue.address && (
                          <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                            📍 {venue.address}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            venue.type === "shop"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-orange-50 text-orange-700 border border-orange-200"
                          }`}
                        >
                          {venue.type === "shop" ? "🛒 Shop" : "🍔 Restaurant"}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {venue.owner_name || "N/A"}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {venue.owner_email || ""}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {venue.created_at
                          ? new Date(venue.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"}
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleMutation.mutate(venue.id)}
                            disabled={toggleMutation.isPending}
                            className="bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                          >
                            Approve Venue ✓
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await showAdminConfirm({
                                title: "Delete Pending Venue?",
                                message: `Are you sure you want to permanently delete "${venue.name}"?`,
                                confirmText: "Yes, Delete",
                                cancelText: "Cancel",
                                variant: "danger",
                              });
                              if (confirmed) {
                                deleteMutation.mutate(venue.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-3 py-2 rounded-xl transition-all border border-red-200 cursor-pointer"
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
