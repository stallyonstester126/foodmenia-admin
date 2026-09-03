"use client";

import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

interface RestaurantPerformance {
  restaurant_id: number;
  restaurant_name: string;
  type: "restaurant" | "shop";
  address?: string;
  is_active: boolean;
  rating: number;
  orders_count: number;
  gross_revenue: number;
  avg_order_value: number;
  delivered_orders: number;
  cancelled_orders: number;
  active_orders: number;
  completion_rate: number;
}

interface RecentOrder {
  id: number;
  status: "placed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  delivery_fee: number;
  platform_fee: number;
  discount_amount: number;
  total: number;
  placed_at: string;
  restaurant_id: number;
  restaurant_name: string;
  user_id: number;
  user_name: string;
  user_email: string;
  rider_name?: string;
}

interface AnalyticsApiResponse {
  overview: {
    total_orders: number;
    total_revenue: number;
    total_subtotal: number;
    total_platform_fees: number;
    total_tax_collected: number;
    total_delivery_fees: number;
    avg_order_value: number;
    completion_rate: number;
    delivered_count: number;
    cancelled_count: number;
    active_count: number;
  };
  status_distribution: {
    placed: number;
    preparing: number;
    ready: number;
    delivering: number;
    delivered: number;
    cancelled: number;
  };
  restaurants: RestaurantPerformance[];
  recent_orders: RecentOrder[];
}

export default function AdminOrdersAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>("all");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);

  const { data, isLoading, refetch } = useQuery<AnalyticsApiResponse>({
    queryKey: ["admin-orders-analytics", timeRange, selectedRestaurantId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (timeRange !== "all") params.append("time_range", timeRange);
      if (selectedRestaurantId !== "all") params.append("restaurant_id", selectedRestaurantId);
      return apiClient.get<AnalyticsApiResponse>(`/admin/orders/analytics?${params.toString()}`);
    },
  });

  const overview = data?.overview || {
    total_orders: 0,
    total_revenue: 0,
    total_subtotal: 0,
    total_platform_fees: 0,
    total_tax_collected: 0,
    total_delivery_fees: 0,
    avg_order_value: 0,
    completion_rate: 0,
    delivered_count: 0,
    cancelled_count: 0,
    active_count: 0,
  };

  const statusDist = data?.status_distribution || {
    placed: 0,
    preparing: 0,
    ready: 0,
    delivering: 0,
    delivered: 0,
    cancelled: 0,
  };

  const restaurants = data?.restaurants || [];
  const recentOrders = data?.recent_orders || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "delivering":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "preparing":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "placed":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200 font-poppins">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-xl font-bold">
                📈
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Orders &amp; Platform Analytics
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Executive sales analysis, per-restaurant order metrics, tax &amp; platform fee collections.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Restaurant Filter Dropdown */}
            <select
              value={selectedRestaurantId}
              onChange={(e) => setSelectedRestaurantId(e.target.value)}
              className="bg-white px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50 shadow-2xs"
            >
              <option value="all">All Restaurants &amp; Shops</option>
              {restaurants.map((r) => (
                <option key={r.restaurant_id} value={String(r.restaurant_id)}>
                  {r.restaurant_name} ({r.type})
                </option>
              ))}
            </select>

            {/* Time Range Pills */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex items-center gap-1 shadow-2xs">
              {[
                { id: "today", label: "Today" },
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "all", label: "All Time" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeRange === t.id
                      ? "bg-[#1A1A1A] text-white shadow-xs"
                      : "text-gray-600 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              className="bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-xl border border-gray-200 shadow-2xs transition-all cursor-pointer"
              title="Refresh Analytics"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-gray-400 font-bold">
                Gross Platform Revenue
              </span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                💵
              </span>
            </div>
            <div className="mt-3">
              <span className="block font-bold text-2xl text-[#1A1A1A]">
                Rs. {overview.total_revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-2xs text-gray-400 mt-1 block">
                Subtotal: Rs. {overview.total_subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-gray-400 font-bold">
                Total Orders Placed
              </span>
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
                📦
              </span>
            </div>
            <div className="mt-3">
              <span className="block font-bold text-2xl text-[#1A1A1A]">
                {overview.total_orders.toLocaleString()}
              </span>
              <div className="flex items-center gap-2 text-2xs text-gray-400 mt-1">
                <span className="text-emerald-600 font-semibold">{overview.delivered_count} delivered</span>
                <span>•</span>
                <span className="text-red-500">{overview.cancelled_count} cancelled</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-gray-400 font-bold">
                Platform Fees Earned
              </span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                ⚡
              </span>
            </div>
            <div className="mt-3">
              <span className="block font-bold text-2xl text-amber-600">
                Rs. {overview.total_platform_fees.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-2xs text-gray-400 mt-1 block">
                Taxes Collected: Rs. {overview.total_tax_collected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-wider text-gray-400 font-bold">
                Average Order Value
              </span>
              <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">
                🎯
              </span>
            </div>
            <div className="mt-3">
              <span className="block font-bold text-2xl text-[#1A1A1A]">
                Rs. {overview.avg_order_value.toFixed(2)}
              </span>
              <div className="flex items-center gap-1.5 text-2xs text-emerald-600 font-bold mt-1">
                <span>✓</span>
                <span>{overview.completion_rate}% Completion Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Distribution Strip */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">
              Order Pipeline Distribution
            </h3>
            <span className="text-xs font-semibold text-gray-400">
              {overview.active_count} active orders in progress
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: "Placed", count: statusDist.placed, color: "text-orange-600", bg: "bg-orange-50" },
              { label: "Preparing", count: statusDist.preparing, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Ready", count: statusDist.ready, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Delivering", count: statusDist.delivering, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Delivered", count: statusDist.delivered, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Cancelled", count: statusDist.cancelled, color: "text-red-600", bg: "bg-red-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} p-3 rounded-xl flex items-center justify-between`}>
                <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                <span className={`font-bold text-base ${s.color}`}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Restaurant Breakdown Performance Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-base text-[#1A1A1A]">
                Restaurant &amp; Shop Performance Matrix
              </h2>
              <p className="text-xs text-gray-400">
                Order fulfillment volume, gross revenue, and delivery success rate breakdown by venue.
              </p>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {restaurants.length} venue{restaurants.length === 1 ? "" : "s"} tracked
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#FCBA08] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400 font-medium">Calculating restaurant analytics...</span>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              No restaurant performance data available for this time range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 uppercase tracking-wider text-2xs font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Venue</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-center">Orders</th>
                    <th className="py-3.5 px-4 text-right">Gross Volume</th>
                    <th className="py-3.5 px-4 text-right">Avg Ticket</th>
                    <th className="py-3.5 px-4 text-center">Delivered</th>
                    <th className="py-3.5 px-4">Success Rate</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {restaurants.map((r) => (
                    <tr key={r.restaurant_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{r.type === "shop" ? "🛒" : "🍔"}</span>
                          <div>
                            <span className="font-bold text-[#1A1A1A] block">{r.restaurant_name}</span>
                            <span className="text-2xs text-gray-400">{r.address || `ID #${r.restaurant_id}`}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full text-2xs font-bold bg-gray-100 text-gray-700">
                          {r.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                        {r.orders_count}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-[#1A1A1A]">
                        Rs. {r.gross_revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-gray-600">
                        Rs. {r.avg_order_value.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-emerald-700 font-bold">{r.delivered_orders}</span>
                        {r.cancelled_orders > 0 && (
                          <span className="text-red-500 text-2xs ml-1">({r.cancelled_orders} cnl)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, r.completion_rate)}%` }}
                            />
                          </div>
                          <span className="text-2xs font-bold text-gray-600">{r.completion_rate}%</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedRestaurantId(String(r.restaurant_id))}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg transition-all cursor-pointer"
                        >
                          View Orders
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Orders Feed */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-[#1A1A1A]">Recent Order Transmissions</h2>
              <p className="text-xs text-gray-400">
                Live stream of order checkout events with full financial line items.
              </p>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Latest {recentOrders.length} orders
            </span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">
              No orders recorded in this filter period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 uppercase tracking-wider text-2xs font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Restaurant</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Subtotal</th>
                    <th className="py-3.5 px-4 text-right">Tax &amp; Fees</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4">Placed At</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((o) => {
                    const feeSum = (Number(o.tax_amount || 0) + Number(o.platform_fee || 0) + Number(o.delivery_fee || 0));

                    return (
                      <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                          #{o.id}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-800 block">{o.user_name}</span>
                          <span className="text-2xs text-gray-400">{o.user_email}</span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          {o.restaurant_name}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold border capitalize ${getStatusBadge(
                              o.status
                            )}`}
                          >
                            {o.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right text-gray-600">
                          Rs. {Number(o.subtotal).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-right text-amber-600 font-medium">
                          +Rs. {feeSum.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-[#1A1A1A]">
                          Rs. {Number(o.total).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-gray-400 text-2xs">
                          {new Date(o.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="text-xs font-bold text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-all cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-[#1A1A1A]">
                    Order #{selectedOrder.id} Breakdown
                  </h3>
                  <span className="text-2xs text-gray-400">
                    Placed on {new Date(selectedOrder.placed_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-bold text-[#1A1A1A]">{selectedOrder.user_name} ({selectedOrder.user_email})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Restaurant</span>
                  <span className="font-bold text-[#1A1A1A]">{selectedOrder.restaurant_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Assigned Rider</span>
                  <span className="font-semibold text-amber-700">{selectedOrder.rider_name || "Unassigned"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-bold capitalize ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2 text-xs font-poppins">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">Rs. {Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span className="font-semibold">Rs. {Number(selectedOrder.platform_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax {selectedOrder.tax_rate ? `(${selectedOrder.tax_rate}%)` : ""}</span>
                  <span className="font-semibold">Rs. {Number(selectedOrder.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">Rs. {Number(selectedOrder.delivery_fee).toFixed(2)}</span>
                </div>
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-Rs. {Number(selectedOrder.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm text-[#1A1A1A]">
                  <span>Grand Total</span>
                  <span className="text-amber-600">Rs. {Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
