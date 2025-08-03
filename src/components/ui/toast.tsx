"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

/**
 * Individual Toast Component
 * Menggunakan fixed positioning untuk memastikan selalu visible
 */
function Toast({ toast, onRemove }: ToastProps): React.JSX.Element {
  const [isVisible, setIsVisible] = React.useState<boolean>(false);
  const [isExiting, setIsExiting] = React.useState<boolean>(false);

  const handleRemove = React.useCallback((): void => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  React.useEffect(() => {
    // Trigger slide-in animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-hide timer (jika tidak persistent)
    let hideTimer: NodeJS.Timeout | undefined;
    if (!toast.persistent) {
      hideTimer = setTimeout(() => {
        handleRemove();
      }, toast.duration || 5000);
    }

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [toast.duration, toast.persistent, handleRemove]);

  const getIcon = (): React.JSX.Element | null => {
    const iconClass = "h-5 w-5 flex-shrink-0";

    switch (toast.type) {
      case "success":
        return <CheckCircle className={cn(iconClass, "text-green-500")} />;
      case "error":
        return <XCircle className={cn(iconClass, "text-red-500")} />;
      case "warning":
        return <AlertTriangle className={cn(iconClass, "text-yellow-500")} />;
      case "info":
        return <Info className={cn(iconClass, "text-blue-500")} />;
      default:
        return null;
    }
  };

  const getBackgroundClass = (): string => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
      case "error":
        return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
      default:
        return "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700";
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out max-w-md w-full",
        getBackgroundClass(),
        isVisible && !isExiting
          ? "transform translate-x-0 opacity-100"
          : "transform translate-x-full opacity-0",
        isExiting && "transform translate-x-full opacity-0"
      )}
      role="alert"
      aria-live="polite"
    >
      {getIcon()}

      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {toast.title}
          </h4>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {toast.message}
        </p>
      </div>

      <button
        onClick={handleRemove}
        className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
      </button>
    </div>
  );
}

/**
 * Toast Container Component
 * Portal-based untuk memastikan z-index tertinggi
 */
export interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({
  toasts,
  onRemoveToast,
}: ToastContainerProps): React.ReactPortal | null {
  const [mounted, setMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifikasi"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemoveToast} />
        </div>
      ))}
    </div>,
    document.body
  );
}

/**
 * Toast Hook
 * Menggantikan useNotification dengan sistem yang lebih robust
 */
export interface UseToastReturn {
  toasts: ToastMessage[];
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

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const generateId = (): string => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const showToast = React.useCallback(
    (config: Omit<ToastMessage, "id">): string => {
      const id = generateId();
      const toast: ToastMessage = {
        id,
        duration: 5000,
        persistent: false,
        ...config,
      };

      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const showSuccess = React.useCallback(
    (
      message: string,
      title?: string,
      options?: { duration?: number; persistent?: boolean }
    ): string => {
      return showToast({
        type: "success",
        title,
        message,
        ...options,
      });
    },
    [showToast]
  );

  const showError = React.useCallback(
    (
      message: string,
      title?: string,
      options?: { duration?: number; persistent?: boolean }
    ): string => {
      return showToast({
        type: "error",
        title,
        message,
        duration: 8000, // Error notifications stay longer
        ...options,
      });
    },
    [showToast]
  );

  const showWarning = React.useCallback(
    (
      message: string,
      title?: string,
      options?: { duration?: number; persistent?: boolean }
    ): string => {
      return showToast({
        type: "warning",
        title,
        message,
        ...options,
      });
    },
    [showToast]
  );

  const showInfo = React.useCallback(
    (
      message: string,
      title?: string,
      options?: { duration?: number; persistent?: boolean }
    ): string => {
      return showToast({
        type: "info",
        title,
        message,
        ...options,
      });
    },
    [showToast]
  );

  const removeToast = React.useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = React.useCallback((): void => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAllToasts,
  };
}
