import { useState, useEffect, useCallback } from "react";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationMessage {
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
}

/**
 * Custom hook untuk menangani notifikasi dalam aplikasi
 *
 * @param defaultDuration - Durasi default notifikasi dalam milidetik (default: 5000)
 * @returns Object dengan state dan fungsi untuk menangani notifikasi
 *
 * @example
 * ```tsx
 * const { notification, showSuccess, showError, clearNotification } = useNotification();
 *
 * // Menampilkan notifikasi sukses
 * showSuccess("Data berhasil disimpan");
 *
 * // Menampilkan notifikasi error dengan custom duration
 * showError("Terjadi kesalahan", 8000);
 *
 * // Menampilkan notifikasi dengan title
 * showSuccess("Berhasil", "Data telah disimpan ke database");
 * ```
 */
export function useNotification(defaultDuration: number = 5000) {
  const [notification, setNotification] = useState<NotificationMessage | null>(
    null
  );

  /**
   * Menampilkan notifikasi dengan konfigurasi lengkap
   */
  const showNotification = useCallback((config: NotificationMessage) => {
    setNotification(config);
  }, []);

  /**
   * Menampilkan notifikasi sukses
   */
  const showSuccess = useCallback(
    (message: string, title?: string, duration?: number) => {
      showNotification({
        type: "success",
        title,
        message,
        duration: duration || defaultDuration,
      });
    },
    [showNotification, defaultDuration]
  );

  /**
   * Menampilkan notifikasi error
   */
  const showError = useCallback(
    (message: string, title?: string, duration?: number) => {
      showNotification({
        type: "error",
        title,
        message,
        duration: duration || defaultDuration,
      });
    },
    [showNotification, defaultDuration]
  );

  /**
   * Menampilkan notifikasi warning
   */
  const showWarning = useCallback(
    (message: string, title?: string, duration?: number) => {
      showNotification({
        type: "warning",
        title,
        message,
        duration: duration || defaultDuration,
      });
    },
    [showNotification, defaultDuration]
  );

  /**
   * Menampilkan notifikasi info
   */
  const showInfo = useCallback(
    (message: string, title?: string, duration?: number) => {
      showNotification({
        type: "info",
        title,
        message,
        duration: duration || defaultDuration,
      });
    },
    [showNotification, defaultDuration]
  );

  /**
   * Menghapus notifikasi secara manual
   */
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  /**
   * Auto-hide notifikasi setelah duration tertentu
   */
  useEffect(() => {
    if (!notification) return;

    const duration = notification.duration || defaultDuration;
    const timer = setTimeout(() => {
      setNotification(null);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification, defaultDuration]);

  /**
   * Helper untuk menangani API responses
   */
  const handleApiResponse = useCallback(
    (
      response: {
        success?: boolean;
        error?: string;
        message?: string;
        [key: string]: unknown;
      },
      successMessage?: string,
      errorMessage?: string
    ) => {
      if (response.success !== false && !response.error) {
        showSuccess(successMessage || response.message || "Operasi berhasil");
        return true;
      } else {
        const errorMsg =
          errorMessage ||
          response.error ||
          response.message ||
          "Terjadi kesalahan";
        showError(errorMsg);
        return false;
      }
    },
    [showSuccess, showError]
  );

  /**
   * Helper untuk menangani errors dari try-catch
   */
  const handleError = useCallback(
    (error: unknown, customMessage?: string) => {
      const errorMessage =
        customMessage ||
        (error instanceof Error ? error.message : "Terjadi kesalahan sistem");
      showError(errorMessage);
    },
    [showError]
  );

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotification,
    handleApiResponse,
    handleError,
  };
}
