"use client";

import React, { useEffect } from "react";
import { useAdminDialogStore } from "@/lib/adminDialogStore";

export default function AdminDialog() {
  const {
    isOpen,
    type,
    title,
    message,
    confirmText,
    cancelText,
    variant,
    handleConfirm,
    handleCancel,
  } = useAdminDialogStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (type === "confirm") {
          handleCancel();
        } else {
          handleConfirm();
        }
      } else if (e.key === "Enter") {
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, type, handleConfirm, handleCancel]);

  if (!isOpen) return null;

  const getVisuals = () => {
    switch (variant) {
      case "success":
        return {
          iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200",
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ),
          confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30",
        };
      case "error":
      case "danger":
        return {
          iconBg: "bg-red-50 text-red-600 border border-red-200",
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          confirmBtn: "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/30",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 text-amber-600 border border-amber-200",
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30",
        };
      case "info":
      default:
        return {
          iconBg: "bg-blue-50 text-blue-600 border border-blue-200",
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          confirmBtn: "bg-[#1A1A1A] hover:bg-black text-white shadow-sm",
        };
    }
  };

  const { iconBg, icon, confirmBtn } = getVisuals();

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={type === "confirm" ? handleCancel : handleConfirm}
      />

      {/* Dialog Box */}
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 z-10">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>

          <div className="flex-1">
            {title && (
              <h3 className="font-bold text-base sm:text-lg text-[#1A1A1A] leading-tight mb-1">
                {title}
              </h3>
            )}
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-2">
          {type === "confirm" && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all focus:outline-none cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all focus:outline-none cursor-pointer ${confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
