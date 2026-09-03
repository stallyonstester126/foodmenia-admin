"use client";

import { useState, useEffect, useMemo } from "react";
import AdminShell from "@/components/AdminShell";
import { apiClient } from "@/lib/apiClient";
import dynamic from "next/dynamic";

const AdminFleetMap = dynamic(
  () => import("@/components/map/AdminFleetMap"),
  { ssr: false }
);

interface RiderItem {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  account_status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  availability_status: "OFFLINE" | "ONLINE" | "BUSY";
  vehicle_type?: string;
  vehicle_number?: string;
  current_order_id?: number;
  current_lat?: number;
  current_lng?: number;
  last_location_at?: string;
  created_at: string;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<RiderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter !== "ALL") params.accountStatus = statusFilter;

      const res = await apiClient.get<RiderItem[]>("/admin/riders", { params });
      setRiders(res || []);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch rider fleet data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [search, statusFilter]);

  const handleUpdateStatus = async (riderId: number, accountStatus: string) => {
    setActionLoadingId(riderId);
    setMessage(null);
    try {
      await apiClient.patch(`/admin/riders/${riderId}/status`, { accountStatus });
      setMessage({ type: "success", text: `Rider account status updated to ${accountStatus}.` });
      fetchRiders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update rider status.";
      setMessage({ type: "error", text: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  // KPI Calculations
  const totalRiders = riders.length;
  const onlineRiders = riders.filter((r) => r.availability_status === "ONLINE").length;
  const busyRiders = riders.filter((r) => r.availability_status === "BUSY").length;
  const pendingRiders = riders.filter((r) => r.account_status === "PENDING").length;

  const activeLocations = useMemo(
    () => riders.filter((r) => r.current_lat && r.current_lng),
    [riders]
  );

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200 select-none pb-12">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Rider &amp; Fleet Management</h1>
            <p className="text-xs text-gray-500 mt-1">
              Real-time rider dispatch, account verification approvals, and live location auditing.
            </p>
          </div>

          <button
            onClick={fetchRiders}
            className="self-start sm:self-auto px-4 py-2 bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            🔄 Refresh Fleet
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col">
            <span className="text-xs font-semibold text-gray-500">Total Registered</span>
            <span className="text-2xl font-extrabold text-[#1A1A1A] mt-1">{totalRiders}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col">
            <span className="text-xs font-semibold text-gray-500">Online &amp; Ready</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1">{onlineRiders}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col">
            <span className="text-xs font-semibold text-gray-500">Active Delivering</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1">{busyRiders}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col">
            <span className="text-xs font-semibold text-gray-500">Pending Approval</span>
            <span className="text-2xl font-extrabold text-indigo-600 mt-1">{pendingRiders}</span>
          </div>
        </div>

        {/* Live Fleet Dispatch Map */}
        {activeLocations.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-2">
                🗺️ Live Fleet Tracking Map ({activeLocations.length} active GPS nodes)
              </h3>
              <span className="text-[11px] text-gray-400">Updates live via Socket.io</span>
            </div>

            <AdminFleetMap riders={riders} />
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, vehicle..."
              className="w-full rounded-xl border border-gray-200 p-2.5 pl-9 text-xs focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["ALL", "PENDING", "APPROVED", "SUSPENDED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-[#2B1B0E] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Fleet Table */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-100 text-[#1A1A1A] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Rider Details</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4">Active Task</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 font-poppins">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Loading rider fleet data...
                    </td>
                  </tr>
                ) : riders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No riders found matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  riders.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Rider Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FCBA08]/20 text-[#2B1B0E] font-bold flex items-center justify-center flex-shrink-0">
                            {r.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1A1A1A]">{r.name}</span>
                            <span className="text-[11px] text-gray-400">{r.email}</span>
                            <span className="text-[10px] text-gray-500">{r.phone || "No phone"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700">{r.vehicle_type || "N/A"}</span>
                          <span className="text-[11px] text-gray-400">{r.vehicle_number || "No Plate"}</span>
                        </div>
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            r.account_status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.account_status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : r.account_status === "SUSPENDED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {r.account_status}
                        </span>
                      </td>

                      {/* Availability Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-max ${
                            r.availability_status === "ONLINE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.availability_status === "BUSY"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.availability_status === "ONLINE"
                                ? "bg-emerald-500"
                                : r.availability_status === "BUSY"
                                ? "bg-amber-500"
                                : "bg-gray-400"
                            }`}
                          />
                          {r.availability_status}
                        </span>
                      </td>

                      {/* Active Task */}
                      <td className="py-3.5 px-4">
                        {r.current_order_id ? (
                          <span className="font-semibold text-amber-700">Order #{r.current_order_id}</span>
                        ) : (
                          <span className="text-gray-400">Idle</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.account_status === "PENDING" && (
                            <>
                              <button
                                disabled={actionLoadingId === r.id}
                                onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                disabled={actionLoadingId === r.id}
                                onClick={() => handleUpdateStatus(r.id, "REJECTED")}
                                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {r.account_status === "APPROVED" && (
                            <button
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleUpdateStatus(r.id, "SUSPENDED")}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          {(r.account_status === "SUSPENDED" || r.account_status === "REJECTED") && (
                            <button
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
