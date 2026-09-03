"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/AdminShell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

interface PlatformSettings {
  id: number;
  tax_rate_percent: number;
  platform_fee_cents: number;
  platform_fee: number;
  default_delivery_fee_cents: number;
  default_delivery_fee: number;
  is_tax_enabled: boolean;
  currency: string;
  updated_at?: string;
}

export default function AdminTaxFeePage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError } = useQuery<PlatformSettings>({
    queryKey: ["admin-platform-settings"],
    queryFn: () => apiClient.get<PlatformSettings>("/admin/platform-settings"),
  });

  // Local Form States
  const [taxRate, setTaxRate] = useState<number>(5.0);
  const [platformFee, setPlatformFee] = useState<number>(19.99);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState<number>(49.0);
  const [isTaxEnabled, setIsTaxEnabled] = useState<boolean>(true);
  const [currency, setCurrency] = useState<string>("Rs.");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulator state
  const [simSubtotal, setSimSubtotal] = useState<number>(1200);

  useEffect(() => {
    if (settings) {
      setTaxRate(settings.tax_rate_percent ?? 5.0);
      setPlatformFee(settings.platform_fee ?? 19.99);
      setDefaultDeliveryFee(settings.default_delivery_fee ?? 49.0);
      setIsTaxEnabled(settings.is_tax_enabled ?? true);
      setCurrency(settings.currency || "Rs.");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<PlatformSettings>) =>
      apiClient.patch<PlatformSettings>("/admin/platform-settings", payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-platform-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-platform-settings"] });
      setToastMessage("Tax & Platform Fee settings updated successfully!");
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: Error) => {
      setToastMessage(`Error: ${err.message}`);
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      tax_rate_percent: Number(taxRate),
      platform_fee: Number(platformFee),
      default_delivery_fee: Number(defaultDeliveryFee),
      is_tax_enabled: isTaxEnabled,
      currency,
    });
  };

  // Live Simulator Calculations
  const simTaxAmount = isTaxEnabled ? Number(((simSubtotal * taxRate) / 100).toFixed(2)) : 0;
  const simTotal = Number((simSubtotal + simTaxAmount + platformFee + defaultDeliveryFee).toFixed(2));

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 animate-in fade-in duration-200">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl font-bold">
                💰
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Tax &amp; Platform Fee Configuration
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Configure global delivery fees, platform service commissions, and local tax rates. Changes immediately update customer order calculations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {toastMessage && (
              <div className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                toastMessage.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}>
                {toastMessage}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending || isLoading}
              className="bg-[#FCBA08] hover:bg-[#e5a807] text-[#2B1B0E] font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#2B1B0E] border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Settings (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* General Fee Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <h2 className="font-bold text-base text-[#1A1A1A]">Platform Fee Rules</h2>
                </div>
                <span className="text-2xs uppercase tracking-wider text-gray-400 font-semibold">
                  Applied to every order
                </span>
              </div>

              {/* Platform Fee input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Platform Service Fee ({currency})</span>
                  <span className="text-2xs text-gray-400 font-normal">Fixed charge per order checkout</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50"
                  />
                </div>
                <p className="text-2xs text-gray-400">
                  Covers platform maintenance, payment gateway processing, and 24/7 customer support.
                </p>
              </div>

              {/* Default Delivery Fee */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-100">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Default Base Delivery Fee ({currency})</span>
                  <span className="text-2xs text-gray-400 font-normal">When no override is provided by restaurant</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultDeliveryFee}
                    onChange={(e) => setDefaultDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50"
                  />
                </div>
              </div>

              {/* Currency Display Symbol */}
              <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-100">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Display Currency Symbol</span>
                  <span className="text-2xs text-gray-400 font-normal">e.g. Rs., $, AED, PKR</span>
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#FCBA08]/50"
                />
              </div>
            </div>

            {/* Tax Configuration Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏛️</span>
                  <h2 className="font-bold text-base text-[#1A1A1A]">Tax Assessment Settings</h2>
                </div>
                {/* Tax Switch */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">
                    {isTaxEnabled ? "Active" : "Disabled"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTaxEnabled(!isTaxEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                      isTaxEnabled ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        isTaxEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    Tax Rate Percentage (%)
                  </label>
                  <span className="text-sm font-bold text-[#FCBA08] bg-[#2B1B0E] px-2.5 py-0.5 rounded-lg">
                    {taxRate.toFixed(1)}%
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={taxRate}
                  disabled={!isTaxEnabled}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full accent-[#FCBA08] cursor-pointer disabled:opacity-40"
                />

                <div className="flex justify-between text-2xs text-gray-400 font-medium">
                  <span>0% (Tax Exempt)</span>
                  <span>5% (Standard VAT)</span>
                  <span>10% (Regional)</span>
                  <span>20%+ (High)</span>
                </div>

                <div className="mt-2 p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-gray-600 flex items-start gap-2.5">
                  <span className="text-base">💡</span>
                  <p className="leading-relaxed">
                    Tax is computed directly on the items subtotal before voucher discounts and added as a transparent line-item in customer checkout and invoice receipts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Order Receipt Simulator (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs flex flex-col gap-5 sticky top-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧾</span>
                  <h3 className="font-bold text-base text-[#1A1A1A]">Live Checkout Simulator</h3>
                </div>
                <span className="text-2xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                  REAL-TIME PREVIEW
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>Test Order Subtotal</span>
                  <span className="font-bold text-gray-900">{currency} {simSubtotal.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={simSubtotal}
                  onChange={(e) => setSimSubtotal(Number(e.target.value))}
                  className="w-full accent-[#FCBA08] cursor-pointer"
                />
              </div>

              {/* Mock Receipt Card */}
              <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-5 flex flex-col gap-3 font-poppins">
                <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-200/60">
                  <span>Customer Order Summary</span>
                  <span className="text-2xs font-bold text-gray-400">SAMPLE TICKET</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Items Subtotal</span>
                  <span className="font-medium text-gray-800">{currency} {simSubtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Platform Service Fee</span>
                  <span className="font-medium text-gray-800">{currency} {platformFee.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <span>Estimated Tax ({taxRate}%)</span>
                    {!isTaxEnabled && (
                      <span className="text-2xs text-gray-400 italic">(Exempt)</span>
                    )}
                  </div>
                  <span className="font-medium text-gray-800">
                    {isTaxEnabled ? `${currency} ${simTaxAmount.toFixed(2)}` : `${currency} 0.00`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Standard Delivery</span>
                  <span className="font-medium text-gray-800">{currency} {defaultDeliveryFee.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-dashed border-gray-300 flex items-center justify-between font-bold text-sm text-[#2B1B0E]">
                  <span>Total Payable</span>
                  <span className="text-base text-amber-600">
                    {currency} {simTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/60 text-2xs text-amber-900 leading-normal flex items-start gap-2">
                <span>🛡️</span>
                <span>
                  All calculations are executed in integer cents on the backend pricing engine to ensure zero precision loss during credit card authorizations and order placements.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
