"use client";

import * as React from "react";
import { ToastContainer, useToast, ToastMessage } from "@/components/ui/toast";

/**
 * Re-export dari toast.tsx untuk compatibility
 */
export { useToast } from "@/components/ui/toast";
export type {
  UseToastReturn,
  ToastType,
  ToastMessage,
} from "@/components/ui/toast";

/**
 * Toast Context untuk global state management
 */
interface ToastContextValue {
  showToast: (config: Omit<ToastMessage, "id">) => string;
  showSuccess: (
    message: string,
    title?: string,
    options?: { duration?: number; persistent?: boolean }
  ) => string;
  showError: (
    message: string,
    title?: string,
    options?: { duration?: number; persistent?: boolean }
  ) => string;
  showWarning: (
    message: string,
    title?: string,
    options?: { duration?: number; persistent?: boolean }
  ) => string;
  showInfo: (
    message: string,
    title?: string,
    options?: { duration?: number; persistent?: boolean }
  ) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

/**
 * Toast Provider Component
 * Harus dibungkus di root layout untuk akses global
 */
interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({
  children,
}: ToastProviderProps): React.JSX.Element {
  const {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
  } = useToast();

  const contextValue: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook untuk menggunakan toast context
 * Replacement untuk useNotification yang lama
 */
export function useToastContext(): ToastContextValue {
  const context = React.useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }

  return context;
}

/**
 * API Notification Helper
 * Replacement untuk useApiNotification yang lama
 */
export interface UseApiToastReturn {
  executeWithToast: <T>(
    apiCall: () => Promise<Response>,
    successMessage?: string,
    errorMessage?: string,
    options?: {
      showLoading?: boolean;
      parseJson?: boolean;
      onSuccess?: (data: T) => void;
      onError?: (error: unknown) => void;
    }
  ) => Promise<{ success: boolean; data?: T; error?: unknown }>;
  executeDelete: (
    apiCall: () => Promise<Response>,
    itemName?: string
  ) => Promise<{ success: boolean; data?: unknown; error?: unknown }>;
  executeCreate: <T>(
    apiCall: () => Promise<Response>,
    itemName?: string
  ) => Promise<{ success: boolean; data?: T; error?: unknown }>;
  executeUpdate: <T>(
    apiCall: () => Promise<Response>,
    itemName?: string
  ) => Promise<{ success: boolean; data?: T; error?: unknown }>;
}

export function useApiToast(): UseApiToastReturn {
  const { showSuccess, showError, showInfo, removeToast } = useToastContext();

  const executeWithToast = React.useCallback(
    async <T,>(
      apiCall: () => Promise<Response>,
      successMessage?: string,
      errorMessage?: string,
      options?: {
        showLoading?: boolean;
        parseJson?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: unknown) => void;
      }
    ): Promise<{ success: boolean; data?: T; error?: unknown }> => {
      const {
        showLoading = false,
        parseJson = true,
        onSuccess,
        onError,
      } = options || {};

      let loadingToastId: string | undefined;

      try {
        if (showLoading) {
          loadingToastId = showInfo("Memproses permintaan...", undefined, {
            persistent: true,
          });
        }

        const response = await apiCall();
        let data: T | null = null;

        if (parseJson) {
          try {
            data = await response.json();
          } catch (jsonError) {
            console.warn("Failed to parse JSON response:", jsonError);
            data = null;
          }
        }

        // Remove loading toast
        if (loadingToastId) {
          removeToast(loadingToastId);
        }

        if (response.ok) {
          const responseData = data as Record<string, unknown> | null;
          const message =
            successMessage ||
            (responseData?.message as string) ||
            "Operasi berhasil";
          showSuccess(message);

          if (onSuccess) {
            onSuccess(data as T);
          }

          return { success: true, data: data as T };
        } else {
          // Handle validation errors from server
          const responseData = data as Record<string, unknown> | null;
          if (response.status === 400 && responseData?.details) {
            const validationErrors = responseData.details;
            if (Array.isArray(validationErrors)) {
              const errorMessages = validationErrors
                .map(
                  (err: { field: string; message: string }) =>
                    `${err.field}: ${err.message}`
                )
                .join(", ");
              showError(`Validasi error: ${errorMessages}`);
            } else {
              showError(
                (responseData?.error as string) || "Terjadi kesalahan validasi"
              );
            }
          } else {
            const errorMsg =
              errorMessage ||
              (responseData?.error as string) ||
              (responseData?.message as string) ||
              "Terjadi kesalahan";
            showError(errorMsg);
          }

          if (onError) {
            onError(data);
          }

          return { success: false, error: data };
        }
      } catch (error) {
        // Remove loading toast
        if (loadingToastId) {
          removeToast(loadingToastId);
        }

        const errorMsg =
          errorMessage ||
          (error instanceof Error ? error.message : "Terjadi kesalahan sistem");

        showError(errorMsg);

        if (onError) {
          onError(error);
        }

        return { success: false, error };
      }
    },
    [showSuccess, showError, showInfo, removeToast]
  );

  const executeDelete = React.useCallback(
    async (apiCall: () => Promise<Response>, itemName: string = "item") => {
      return executeWithToast(
        apiCall,
        `${itemName} berhasil dihapus`,
        `Gagal menghapus ${itemName}`
      );
    },
    [executeWithToast]
  );

  const executeCreate = React.useCallback(
    async <T,>(apiCall: () => Promise<Response>, itemName: string = "item") => {
      return executeWithToast<T>(
        apiCall,
        `${itemName} berhasil dibuat`,
        `Gagal membuat ${itemName}`
      );
    },
    [executeWithToast]
  );

  const executeUpdate = React.useCallback(
    async <T,>(apiCall: () => Promise<Response>, itemName: string = "item") => {
      return executeWithToast<T>(
        apiCall,
        `${itemName} berhasil diperbarui`,
        `Gagal memperbarui ${itemName}`
      );
    },
    [executeWithToast]
  );

  return {
    executeWithToast,
    executeDelete,
    executeCreate,
    executeUpdate,
  };
}

/**
 * Utility functions untuk compatibility dengan sistem lama
 */
export interface NotificationCompat {
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  clearNotifications: () => void;
}

export function useNotificationCompat(): NotificationCompat {
  const { showSuccess, showError, showWarning, showInfo, clearAllToasts } =
    useToastContext();

  return {
    showSuccess: (message: string, title?: string) =>
      showSuccess(message, title),
    showError: (message: string, title?: string) => showError(message, title),
    showWarning: (message: string, title?: string) =>
      showWarning(message, title),
    showInfo: (message: string, title?: string) => showInfo(message, title),
    clearNotifications: clearAllToasts,
  };
}
