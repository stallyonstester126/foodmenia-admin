"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { showAdminConfirm } from "@/lib/adminDialogStore";

interface Cuisine {
  id: number;
  name: string;
}

interface MenuCategory {
  id: number;
  name: string;
  sort_order?: number;
}

interface MenuItem {
  id: number;
  category_id?: number;
  name: string;
  description?: string;
  image_url?: string;
  base_price: number | string;
  is_available: boolean;
}

interface RestaurantDetails {
  id: number;
  name: string;
  type?: "restaurant" | "shop";
  description?: string;
  cover_image_url?: string;
  address?: string;
  price_tier?: string;
  is_active: boolean;
  created_at: string;
  owner_id?: number | string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  cuisines?: Cuisine[];
  categories?: MenuCategory[];
  menu_items?: MenuItem[];
}

export default function AdminRestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading, isError, error } = useQuery<RestaurantDetails>({
    queryKey: ["admin-restaurant-detail", restaurantId],
    queryFn: () => apiClient.get<RestaurantDetails>(`/admin/restaurants/${restaurantId}`),
    enabled: Boolean(restaurantId),
  });

  const toggleMutation = useMutation({
    mutationFn: () => apiClient.patch(`/admin/restaurants/${restaurantId}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurant-detail", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shops"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/admin/restaurants/${restaurantId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-shops"] });
      router.push(restaurant?.type === "shop" ? "/shops" : "/restaurants");
    },
  });

  const handleToggle = async () => {
    if (restaurant?.is_active) {
      const confirmed = await showAdminConfirm({
        title: "Block Venue?",
        message: `Block "${restaurant.name}"?\n\nThis will hide it from customer listings immediately.`,
        confirmText: "Yes, Block",
        cancelText: "Cancel",
        variant: "danger",
      });
      if (!confirmed) return;
    }
    toggleMutation.mutate();
  };

  const handleDelete = async () => {
    const confirmed = await showAdminConfirm({
      title: "Permanently Delete Venue?",
      message: `Are you sure you want to PERMANENTLY DELETE "${restaurant?.name}"?\n\nThis action cannot be undone.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <AdminShell>
        <div className="w-full py-20 flex flex-col items-center justify-center text-gray-400">
          <div className="w-8 h-8 border-3 border-[#FCBA08] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs">Loading venue profile...</span>
        </div>
      </AdminShell>
    );
  }

  if (isError || !restaurant) {
    return (
      <AdminShell>
        <div className="p-8 text-center text-red-600 text-xs">
          Failed to load venue profile: {(error as Error)?.message || "Not Found"}
        </div>
      </AdminShell>
    );
  }

  const backLink = restaurant.type === "shop" ? "/shops" : "/restaurants";

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Top Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={backLink}
              className="text-xs font-semibold px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 transition-all shadow-2xs"
            >
              ← Back to {restaurant.type === "shop" ? "Shops" : "Restaurants"}
            </Link>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-xs font-bold text-gray-900">{restaurant.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
                restaurant.is_active
                  ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                  : "bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E]"
              }`}
            >
              {toggleMutation.isPending
                ? "Updating..."
                : restaurant.is_active
                ? "Block Active Venue 🚫"
                : "Approve Venue & Flip Live ✓"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-all"
            >
              Delete 🗑️
            </button>
          </div>
        </div>

        {/* Cover Banner & Profile Header */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 text-white min-h-[180px] p-6 flex flex-col justify-end">
          {restaurant.cover_image_url ? (
            <Image
              src={restaurant.cover_image_url}
              alt={restaurant.name}
              fill
              className="object-cover opacity-40"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-950 to-neutral-900 opacity-80" />
          )}

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    restaurant.is_active
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-500 text-amber-950"
                  }`}
                >
                  {restaurant.is_active ? "● Online & Active" : "⏳ Pending Review"}
                </span>

                <span
                  className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${
                    restaurant.type === "shop"
                      ? "bg-purple-600 text-white"
                      : "bg-orange-600 text-white"
                  }`}
                >
                  {restaurant.type === "shop" ? "🛒 Shop / Grocery" : "🍔 Restaurant"}
                </span>

                {restaurant.price_tier && (
                  <span className="bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-mono text-amber-300 border border-white/20">
                    {restaurant.price_tier}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold drop-shadow-md">{restaurant.name}</h1>
              {restaurant.address && (
                <p className="text-xs text-gray-200 mt-1 drop-shadow">📍 {restaurant.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid: Owner Details & Profile Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs flex flex-col gap-3">
            <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
              <span>👤</span> Owner Account Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-gray-100">
              <div>
                <span className="text-gray-400 block font-medium">Owner Name</span>
                <span className="font-semibold text-gray-900">{restaurant.owner_name || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Owner Email</span>
                <span className="font-semibold text-gray-900">{restaurant.owner_email || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Contact Phone</span>
                <span className="font-semibold text-gray-900">{restaurant.owner_phone || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Account ID</span>
                <span className="font-mono text-gray-700">{restaurant.owner_id || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Description & Cuisines */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs flex flex-col gap-3">
            <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
              <span>📜</span> About Venue &amp; Categories
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {restaurant.description || "No description provided."}
            </p>
            {restaurant.cuisines && restaurant.cuisines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                {restaurant.cuisines.map((c) => (
                  <span
                    key={c.id}
                    className="bg-amber-50 text-amber-900 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Read-Only Menu / Catalog Audit */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#1A1A1A]">
              Catalog &amp; Menu Audit ({restaurant.menu_items?.length || 0} Items)
            </h3>
            <span className="text-xs text-gray-400">Read-Only Audit View</span>
          </div>

          {!restaurant.menu_items || restaurant.menu_items.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs bg-gray-50 rounded-xl">
              No catalog items submitted by this venue yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurant.menu_items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50/70 rounded-xl border border-gray-200 p-3.5 flex items-center gap-3"
                >
                  <div className="relative w-14 h-14 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        {restaurant.type === "shop" ? "📦" : "🍲"}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-xs text-gray-900 truncate">{item.name}</span>
                    <span className="font-bold text-xs text-[#2B1B0E]">
                      Rs. {Number(item.base_price || 0).toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold mt-0.5 ${
                        item.is_available ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {item.is_available ? "In Stock" : "Unavailable"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
