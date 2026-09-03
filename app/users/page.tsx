"use client";

import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

interface UserItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "restaurant_owner" | "rider" | "admin";
  email_verified: boolean;
  created_at: string;
}

interface UsersApiResponse {
  users?: UserItem[];
  stats?: {
    total: number;
    customer: number;
    rider: number;
    restaurant_owner: number;
    admin: number;
  };
  total?: number;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState<string>("customer");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<UsersApiResponse | UserItem[]>({
    queryKey: ["admin-users", selectedRole, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedRole !== "all") params.append("role", selectedRole);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      return apiClient.get<UsersApiResponse | UserItem[]>(`/admin/users?${params.toString()}`);
    },
  });

  const rawUsers: UserItem[] = Array.isArray(data)
    ? data
    : (data as UsersApiResponse)?.users || [];

  const stats = (!Array.isArray(data) && (data as UsersApiResponse)?.stats) || {
    total: rawUsers.length,
    customer: rawUsers.filter((u) => u.role === "customer").length,
    restaurant_owner: rawUsers.filter((u) => u.role === "restaurant_owner").length,
    rider: rawUsers.filter((u) => u.role === "rider").length,
    admin: rawUsers.filter((u) => u.role === "admin").length,
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      apiClient.patch(`/admin/users/${userId}/role`, { role }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setToastMessage(`User role successfully changed to ${variables.role}!`);
      setTimeout(() => setToastMessage(null), 4000);
      setEditingUser(null);
    },
    onError: (err: Error) => {
      setToastMessage(`Error: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "restaurant_owner":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "rider":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "restaurant_owner":
        return "Restaurant Owner";
      case "rider":
        return "Delivery Rider";
      default:
        return "Customer";
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200 font-poppins">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl font-bold">
                👥
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                User Accounts &amp; Roles
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Directory of all registered platform accounts with real-time role assignments and permission controls.
            </p>
          </div>

          {toastMessage && (
            <div
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                toastMessage.startsWith("Error")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {toastMessage}
            </div>
          )}
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div
            onClick={() => setSelectedRole("all")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedRole === "all"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-sm"
                : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-2xs font-bold uppercase tracking-wider opacity-70">
              Total Users
            </span>
            <span className="block font-bold text-2xl mt-1">{stats.total}</span>
          </div>

          <div
            onClick={() => setSelectedRole("customer")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedRole === "customer"
                ? "bg-[#FCBA08] text-[#2B1B0E] border-[#FCBA08] shadow-sm"
                : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-2xs font-bold uppercase tracking-wider opacity-70">
              Customers
            </span>
            <span className="block font-bold text-2xl mt-1">{stats.customer}</span>
          </div>

          <div
            onClick={() => setSelectedRole("restaurant_owner")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedRole === "restaurant_owner"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-2xs font-bold uppercase tracking-wider opacity-70">
              Restaurant Owners
            </span>
            <span className="block font-bold text-2xl mt-1">{stats.restaurant_owner}</span>
          </div>

          <div
            onClick={() => setSelectedRole("rider")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedRole === "rider"
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-2xs font-bold uppercase tracking-wider opacity-70">
              Riders
            </span>
            <span className="block font-bold text-2xl mt-1">{stats.rider}</span>
          </div>

          <div
            onClick={() => setSelectedRole("admin")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedRole === "admin"
                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                : "bg-white text-gray-800 border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="text-2xs font-bold uppercase tracking-wider opacity-70">
              Admins
            </span>
            <span className="block font-bold text-2xl mt-1">{stats.admin}</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <span className="text-xs text-gray-400 font-medium">
              Showing {rawUsers.length} user{rawUsers.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#FCBA08] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400 font-medium">Loading user accounts...</span>
            </div>
          ) : rawUsers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <span className="text-3xl">👤</span>
              <h3 className="font-bold text-sm text-[#1A1A1A]">No users found</h3>
              <p className="text-xs text-gray-400">
                {searchQuery ? "Try broadening your search query." : "No registered accounts match the selected role filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200/80 text-gray-500 uppercase tracking-wider text-2xs font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rawUsers.map((u) => {
                    const initials = (u.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-[#1A1A1A] block">{u.name}</span>
                              <span className="text-2xs text-gray-400">ID #{u.id}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                          {u.email}
                        </td>

                        <td className="py-3.5 px-4 text-gray-500">
                          {u.phone || "—"}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-bold border ${getRoleBadge(
                              u.role
                            )}`}
                          >
                            {getRoleLabel(u.role)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.email_verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-2xs">
                              <span>✓</span> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-2xs">
                              <span>⏳</span> Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-gray-400 text-2xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setNewRole(u.role);
                            }}
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Edit Role
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

        {/* Role Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-200 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-base text-[#1A1A1A]">Change User Role</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="text-xs text-gray-600">
                  Update role and permission level for <span className="font-bold text-[#1A1A1A]">{editingUser.name}</span> ({editingUser.email}):
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700">Select Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50"
                >
                  <option value="customer">Customer (Order &amp; Browse)</option>
                  <option value="restaurant_owner">Restaurant Owner (Manage Venues &amp; Menus)</option>
                  <option value="rider">Rider (Deliver Orders)</option>
                  <option value="admin">Platform Admin (Full System Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateRoleMutation.mutate({
                      userId: editingUser.id,
                      role: newRole,
                    })
                  }
                  disabled={updateRoleMutation.isPending}
                  className="bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {updateRoleMutation.isPending ? "Updating..." : "Confirm Change"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
