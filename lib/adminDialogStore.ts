import { create } from "zustand";

export type AdminDialogVariant = "success" | "error" | "warning" | "info" | "danger";
export type AdminDialogType = "alert" | "confirm";

export interface AdminDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: AdminDialogVariant;
}

interface AdminDialogState {
  isOpen: boolean;
  type: AdminDialogType;
  title?: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: AdminDialogVariant;
  resolvePromise?: (value: boolean) => void;
  openAlert: (options: AdminDialogOptions) => Promise<void>;
  openConfirm: (options: AdminDialogOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useAdminDialogStore = create<AdminDialogState>((set, get) => ({
  isOpen: false,
  type: "alert",
  title: undefined,
  message: "",
  confirmText: "OK",
  cancelText: "Cancel",
  variant: "info",
  resolvePromise: undefined,

  openAlert: (options: AdminDialogOptions) => {
    return new Promise<void>((resolve) => {
      set({
        isOpen: true,
        type: "alert",
        title:
          options.title ||
          (options.variant === "error"
            ? "Action Failed"
            : options.variant === "success"
            ? "Action Successful"
            : "Notice"),
        message: options.message,
        confirmText: options.confirmText || "OK",
        cancelText: "Cancel",
        variant: options.variant || "info",
        resolvePromise: () => resolve(),
      });
    });
  },

  openConfirm: (options: AdminDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        type: "confirm",
        title: options.title || "Confirm Admin Action",
        message: options.message,
        confirmText: options.confirmText || "Confirm Action",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "danger",
        resolvePromise: resolve,
      });
    });
  },

  handleConfirm: () => {
    const { resolvePromise } = get();
    set({ isOpen: false });
    if (resolvePromise) {
      resolvePromise(true);
    }
  },

  handleCancel: () => {
    const { resolvePromise } = get();
    set({ isOpen: false });
    if (resolvePromise) {
      resolvePromise(false);
    }
  },
}));

export const showAdminAlert = (
  options: AdminDialogOptions | string,
  title?: string,
  variant: AdminDialogVariant = "info"
): Promise<void> => {
  if (typeof options === "string") {
    return useAdminDialogStore.getState().openAlert({ message: options, title, variant });
  }
  return useAdminDialogStore.getState().openAlert(options);
};

export const showAdminConfirm = (
  options: AdminDialogOptions | string,
  title?: string,
  variant: AdminDialogVariant = "danger"
): Promise<boolean> => {
  if (typeof options === "string") {
    return useAdminDialogStore.getState().openConfirm({ message: options, title, variant });
  }
  return useAdminDialogStore.getState().openConfirm(options);
};
