import { useNotification } from "@/lib/hooks";

/**
 * Higher-order function untuk menangani API calls dengan notifikasi otomatis
 *
 * Mengikuti prinsip:
 * - Single Responsibility: Hanya menangani API calls dan notifikasi
 * - DRY: Mengurangi boilerplate code untuk API calls
 * - Error Handling: Centralized error handling
 *
 * @example
 * ```tsx
 * const { executeWithNotification } = useApiNotification();
 *
 * const handleSave = async () => {
 *   await executeWithNotification(
 *     () => fetch("/api/save", { method: "POST", body: JSON.stringify(data) }),
 *     "Data berhasil disimpan",
 *     "Gagal menyimpan data"
 *   );
 * };
 * ```
 */
export function useApiNotification() {
  const { showSuccess, showError, showInfo } = useNotification();

  /**
   * Execute API call dengan notifikasi otomatis
   */
  const executeWithNotification = async <T>(
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

    try {
      if (showLoading) {
        showInfo("Memproses permintaan...");
      }

      const response = await apiCall();
      const data = parseJson ? await response.json() : null;

      if (response.ok) {
        const message = successMessage || data?.message || "Operasi berhasil";
        showSuccess(message);

        if (onSuccess) {
          onSuccess(data);
        }

        return { success: true, data };
      } else {
        const errorMsg =
          errorMessage || data?.error || data?.message || "Terjadi kesalahan";
        showError(errorMsg);

        if (onError) {
          onError(data);
        }

        return { success: false, error: data };
      }
    } catch (error) {
      const errorMsg =
        errorMessage ||
        (error instanceof Error ? error.message : "Terjadi kesalahan sistem");

      showError(errorMsg);

      if (onError) {
        onError(error);
      }

      return { success: false, error };
    }
  };

  /**
   * Helper khusus untuk DELETE operations
   */
  const executeDelete = async (
    apiCall: () => Promise<Response>,
    itemName: string = "item"
  ) => {
    return executeWithNotification(
      apiCall,
      `${itemName} berhasil dihapus`,
      `Gagal menghapus ${itemName}`
    );
  };

  /**
   * Helper khusus untuk CREATE operations
   */
  const executeCreate = async <T>(
    apiCall: () => Promise<Response>,
    itemName: string = "item"
  ) => {
    return executeWithNotification<T>(
      apiCall,
      `${itemName} berhasil dibuat`,
      `Gagal membuat ${itemName}`
    );
  };

  /**
   * Helper khusus untuk UPDATE operations
   */
  const executeUpdate = async <T>(
    apiCall: () => Promise<Response>,
    itemName: string = "item"
  ) => {
    return executeWithNotification<T>(
      apiCall,
      `${itemName} berhasil diperbarui`,
      `Gagal memperbarui ${itemName}`
    );
  };

  return {
    executeWithNotification,
    executeDelete,
    executeCreate,
    executeUpdate,
  };
}
