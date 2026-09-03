"use client";

import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { showAdminAlert, showAdminConfirm } from "@/lib/adminDialogStore";

interface Voucher {
  id: number;
  code: string;
  discount_type: "percent" | "flat" | "free_delivery";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  usage_limit: number;
  per_user_limit: number;
  is_active: boolean;
  redeemed_count: number;
  is_expired?: boolean;
  is_exhausted?: boolean;
  created_at: string;
}

interface Redemption {
  id: number;
  user_name: string;
  user_email: string;
  order_id?: number | null;
  order_total?: number | null;
  redeemed_at: string;
}

export default function AdminVouchersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "expired" | "exhausted">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [redemptionsVoucher, setRedemptionsVoucher] = useState<Voucher | null>(null);

  // Form Fields
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "flat" | "free_delivery">("percent");
  const [discountValue, setDiscountValue] = useState<number | "">(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | "">(200);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | "">(150);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | "">(1000);
  const [perUserLimit, setPerUserLimit] = useState<number | "">(1);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  // 1. Fetch Vouchers
  const { data: vouchers = [], isLoading, isError, error } = useQuery<Voucher[]>({
    queryKey: ["admin-vouchers", statusFilter, searchQuery],
    queryFn: async () => {
      let url = "/admin/vouchers";
      const params = new URLSearchParams();
      if (statusFilter === "active" || statusFilter === "inactive") {
        params.append("status", statusFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await apiClient.get<unknown>(url);
      let list: Voucher[] = [];
      if (Array.isArray(res)) list = res as Voucher[];
      else if (res && typeof res === "object") {
        const obj = res as Record<string, unknown>;
        if (Array.isArray(obj.vouchers)) list = obj.vouchers as Voucher[];
        else if (Array.isArray(obj.data)) list = obj.data as Voucher[];
      }

      if (statusFilter === "expired") {
        return list.filter((v) => v.is_expired || (v.valid_until && new Date(v.valid_until) < new Date()));
      }
      if (statusFilter === "exhausted") {
        return list.filter((v) => v.is_exhausted || (v.usage_limit && v.redeemed_count >= v.usage_limit));
      }

      return list;
    },
  });

  // 2. Fetch Redemptions for Selected Voucher
  const { data: redemptionsList = [], isLoading: isLoadingRedemptions } = useQuery<Redemption[]>({
    queryKey: ["admin-voucher-redemptions", redemptionsVoucher?.id],
    queryFn: async () => {
      if (!redemptionsVoucher) return [];
      const res = await apiClient.get<unknown>(`/admin/vouchers/${redemptionsVoucher.id}/redemptions`);
      if (Array.isArray(res)) return res as Redemption[];
      if (res && typeof res === "object" && Array.isArray((res as Record<string, unknown>).data)) {
        return (res as Record<string, unknown>).data as Redemption[];
      }
      return [];
    },
    enabled: !!redemptionsVoucher,
  });

  // 3. Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountType === "free_delivery" ? 0 : Number(discountValue || 0),
        min_order_amount: Number(minOrderAmount || 0),
        max_discount_amount: discountType === "percent" && maxDiscountAmount !== "" ? Number(maxDiscountAmount) : null,
        valid_from: validFrom ? new Date(validFrom).toISOString() : undefined,
        valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
        usage_limit: Number(usageLimit || 1000),
        per_user_limit: Number(perUserLimit || 1),
        is_active: isActive,
      };

      if (editingVoucher) {
        return apiClient.patch(`/admin/vouchers/${editingVoucher.id}`, payload);
      }
      return apiClient.post("/admin/vouchers", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      closeFormModal();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || "Failed to save voucher.";
      setFormError(msg);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/admin/vouchers/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/vouchers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as Error)?.message || "Failed to delete voucher.";
      showAdminAlert({
        title: "Deletion Failed",
        message: msg,
        variant: "error",
      });
    },
  });

  // Modal Handlers
  const openCreateModal = () => {
    setEditingVoucher(null);
    setCode("");
    setDiscountType("percent");
    setDiscountValue(10);
    setMinOrderAmount(200);
    setMaxDiscountAmount(150);
    setValidFrom("");
    setValidUntil("");
    setUsageLimit(1000);
    setPerUserLimit(1);
    setIsActive(true);
    setFormError("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setCode(voucher.code);
    setDiscountType(voucher.discount_type);
    setDiscountValue(voucher.discount_value);
    setMinOrderAmount(voucher.min_order_amount);
    setMaxDiscountAmount(voucher.max_discount_amount ?? "");
    setValidFrom(voucher.valid_from ? new Date(voucher.valid_from).toISOString().slice(0, 16) : "");
    setValidUntil(voucher.valid_until ? new Date(voucher.valid_until).toISOString().slice(0, 16) : "");
    setUsageLimit(voucher.usage_limit);
    setPerUserLimit(voucher.per_user_limit);
    setIsActive(voucher.is_active);
    setFormError("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingVoucher(null);
    setFormError("");
  };

  const handleToggleActive = (voucher: Voucher) => {
    toggleMutation.mutate(voucher.id);
  };

  const handleDelete = async (voucher: Voucher) => {
    if (voucher.redeemed_count > 0) {
      await showAdminAlert({
        title: "Cannot Delete Voucher",
        message: `Cannot delete voucher "${voucher.code}" because it has already been redeemed ${voucher.redeemed_count} time(s). Please deactivate it instead.`,
        variant: "warning",
      });
      return;
    }
    const confirmed = await showAdminConfirm({
      title: "Permanently Delete Voucher?",
      message: `Are you sure you want to permanently delete voucher "${voucher.code}"?\n\nThis promotional code will be removed permanently.`,
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (confirmed) deleteMutation.mutate(voucher.id);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError("Voucher code is required.");
      return;
    }
    if (discountType !== "free_delivery" && (!discountValue || Number(discountValue) <= 0)) {
      setFormError("Discount value must be a positive number.");
      return;
    }
    if (validFrom && validUntil && new Date(validUntil) <= new Date(validFrom)) {
      setFormError("Valid Until date must be strictly after Valid From date.");
      return;
    }
    setFormError("");
    saveMutation.mutate();
  };

  // Helper for formatting discount label
  const formatDiscountLabel = (v: Voucher) => {
    if (v.discount_type === "percent") {
      return `${v.discount_value}% OFF${v.max_discount_amount ? ` (Max Rs. ${v.max_discount_amount})` : ""}`;
    }
    if (v.discount_type === "flat") {
      return `Rs. ${v.discount_value.toFixed(2)} OFF`;
    }
    return "Free Delivery";
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎟️</span>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Voucher &amp; Promo Code Management
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Create discount promo codes, configure redemptions, and track customer usage history.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="text-sm">+</span> Create Voucher
          </button>
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
              placeholder="Search voucher code (e.g. WELCOME10)..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50 transition-all"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === "all" ? "bg-[#2B1B0E] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({vouchers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === "active" ? "bg-emerald-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ● Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === "inactive" ? "bg-gray-700 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ○ Inactive
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("expired")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === "expired" ? "bg-amber-500 text-amber-950 font-bold shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ⏰ Expired
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("exhausted")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === "exhausted" ? "bg-red-600 text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🚫 Exhausted
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-gray-400">
              <div className="w-8 h-8 border-3 border-[#FCBA08] border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-medium">Loading vouchers records...</span>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-600 text-xs">
              Failed to load vouchers: {(error as Error)?.message || "Server Error"}
            </div>
          ) : vouchers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-2xl flex items-center justify-center text-amber-600">
                🎟️
              </div>
              <h3 className="font-bold text-base text-[#1A1A1A]">No vouchers found</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                No voucher records match your search &amp; filter criteria. Click &quot;+ Create Voucher&quot; to add one.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Voucher Code</th>
                    <th className="py-4 px-6">Discount Offer</th>
                    <th className="py-4 px-6">Min Order</th>
                    <th className="py-4 px-6">Validity Window</th>
                    <th className="py-4 px-6">Usage Count</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {vouchers.map((voucher) => {
                    const isExpired = voucher.is_expired || (voucher.valid_until && new Date(voucher.valid_until) < new Date());
                    const isExhausted = voucher.is_exhausted || (voucher.usage_limit && voucher.redeemed_count >= voucher.usage_limit);

                    return (
                      <tr key={voucher.id} className="hover:bg-amber-50/30 transition-colors group">
                        {/* Code */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-xs px-2.5 py-1 bg-gray-900 text-[#FCBA08] rounded-lg tracking-wider">
                              {voucher.code}
                            </span>
                            {isExpired && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold">
                                Expired
                              </span>
                            )}
                            {isExhausted && (
                              <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold">
                                Exhausted
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Discount Offer */}
                        <td className="py-4 px-6 font-bold text-gray-900 whitespace-nowrap">
                          {formatDiscountLabel(voucher)}
                        </td>

                        {/* Min Order */}
                        <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                          Rs. {voucher.min_order_amount.toFixed(2)}
                        </td>

                        {/* Validity Window */}
                        <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                          {voucher.valid_until
                            ? `Until ${new Date(voucher.valid_until).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                            : "No Expiry"}
                        </td>

                        {/* Usage */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              {voucher.redeemed_count} / {voucher.usage_limit}
                            </span>
                            {voucher.redeemed_count > 0 && (
                              <button
                                type="button"
                                onClick={() => setRedemptionsVoucher(voucher)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                              >
                                View Log ({voucher.redeemed_count})
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status Dot */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                              voucher.is_active && !isExpired && !isExhausted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                voucher.is_active && !isExpired && !isExhausted ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                            />
                            {voucher.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(voucher)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                            >
                              Edit ✏️
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(voucher)}
                              disabled={toggleMutation.isPending}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                voucher.is_active
                                  ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {voucher.is_active ? "Deactivate" : "Activate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(voucher)}
                              disabled={deleteMutation.isPending || voucher.redeemed_count > 0}
                              title={voucher.redeemed_count > 0 ? "Cannot delete redeemed voucher" : "Delete voucher"}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                voucher.redeemed_count > 0
                                  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                                  : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                              }`}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CREATE / EDIT VOUCHER MODAL */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                <h2 className="font-bold text-lg text-gray-900">
                  {editingVoucher ? `Edit Voucher: ${editingVoucher.code}` : "Create New Voucher"}
                </h2>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3 rounded-xl mb-4">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                {/* Code & Active Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Voucher Code *</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME10"
                      required
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Status</label>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`h-[38px] rounded-xl font-bold text-xs transition-all ${
                        isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isActive ? "● Active" : "○ Inactive"}
                    </button>
                  </div>
                </div>

                {/* Discount Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Discount Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["percent", "flat", "free_delivery"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDiscountType(t)}
                        className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                          discountType === t
                            ? "bg-[#2B1B0E] text-[#FCBA08] border-[#2B1B0E] shadow-xs"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {t === "free_delivery" ? "Free Delivery" : t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount Value & Max Discount */}
                {discountType !== "free_delivery" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700">
                        {discountType === "percent" ? "Discount Percentage (%) *" : "Flat Discount (Rs.) *"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder={discountType === "percent" ? "10" : "100"}
                        required
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
                      />
                    </div>

                    {discountType === "percent" && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-700">Max Discount Cap (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={maxDiscountAmount}
                          onChange={(e) => setMaxDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="e.g. 150"
                          className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Min Order & Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Min Order (Rs.)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0.00"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Total Global Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="1000"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Limit Per User</label>
                    <input
                      type="number"
                      min="1"
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="1"
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
                    />
                  </div>
                </div>

                {/* Date Window */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Valid From</label>
                    <input
                      type="datetime-local"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Valid Until (Expiry)</label>
                    <input
                      type="datetime-local"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FCBA08]"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-2">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    {saveMutation.isPending ? "Saving..." : editingVoucher ? "Update Voucher" : "Create Voucher"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REDEMPTIONS HISTORY MODAL */}
        {redemptionsVoucher && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h2 className="font-bold text-lg text-gray-900">
                    Redemption History: <span className="font-mono text-[#2B1B0E]">{redemptionsVoucher.code}</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Total Redemptions: {redemptionsList.length} of {redemptionsVoucher.usage_limit} limit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRedemptionsVoucher(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              {isLoadingRedemptions ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading redemptions log...</div>
              ) : redemptionsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">
                  No customer has redeemed this voucher code yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Order Total</th>
                        <th className="py-3 px-4">Redemption Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                      {redemptionsList.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-bold text-gray-900">{r.user_name}</td>
                          <td className="py-3 px-4 text-gray-500">{r.user_email}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            #{r.order_id || "N/A"}
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            {r.order_total ? `Rs. ${Number(r.order_total).toFixed(2)}` : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {r.redeemed_at
                              ? new Date(r.redeemed_at).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
