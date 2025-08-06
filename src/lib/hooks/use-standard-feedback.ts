"use client";

import { useToastContext, useApiToast } from "@/components/providers/toast-provider";
import { useConfirmation } from "@/components/ui/confirmation-dialog";
import { useCallback } from "react";

/**
 * Standard feedback hook untuk konsistensi UI/UX di seluruh aplikasi
 * Menggabungkan toast, confirmation, dan loading states
 */
export function useStandardFeedback() {
  const { showSuccess, showError, showWarning, showInfo } = useToastContext();
  const { executeWithToast, executeCreate, executeUpdate, executeDelete } = useApiToast();
  const { confirm, confirmDelete, ConfirmationComponent } = useConfirmation();

  // Standard success patterns
  const feedback = {
    // Toast notifications
    success: (message: string, title?: string) => showSuccess(message, title),
    error: (message: string, title?: string) => showError(message, title),
    warning: (message: string, title?: string) => showWarning(message, title),
    info: (message: string, title?: string) => showInfo(message, title),

    // Standard success messages
    created: (itemName?: string) => 
      showSuccess(`${itemName || "Item"} berhasil dibuat`),
    updated: (itemName?: string) => 
      showSuccess(`${itemName || "Item"} berhasil diperbarui`),
    deleted: (itemName?: string) => 
      showSuccess(`${itemName || "Item"} berhasil dihapus`),
    saved: () => showSuccess("Data berhasil disimpan"),
    loaded: () => showSuccess("Data berhasil dimuat"),

    // Standard error messages  
    createFailed: (itemName?: string, error?: string) =>
      showError(error || `Gagal membuat ${itemName || "item"}`),
    updateFailed: (itemName?: string, error?: string) =>
      showError(error || `Gagal memperbarui ${itemName || "item"}`),
    deleteFailed: (itemName?: string, error?: string) =>
      showError(error || `Gagal menghapus ${itemName || "item"}`),
    loadFailed: (error?: string) =>
      showError(error || "Gagal memuat data"),
    saveFailed: (error?: string) =>
      showError(error || "Gagal menyimpan data"),

    // Confirmation dialogs
    confirm,
    confirmDelete,

    // API operations with feedback
    executeWithToast,
    executeCreate,
    executeUpdate, 
    executeDelete,
  };

  // Standard CRUD operations
  const crud = {
    create: useCallback(async (
      apiCall: () => Promise<Response>,
      itemName?: string,
      onSuccess?: () => void
    ) => {
      const result = await executeCreate(apiCall, itemName);
      if (result.success && onSuccess) {
        onSuccess();
      }
      return result;
    }, [executeCreate]),

    update: useCallback(async (
      apiCall: () => Promise<Response>,
      itemName?: string,
      onSuccess?: () => void
    ) => {
      const result = await executeUpdate(apiCall, itemName);
      if (result.success && onSuccess) {
        onSuccess();
      }
      return result;
    }, [executeUpdate]),

    delete: useCallback(async (
      apiCall: () => Promise<Response>,
      itemName?: string,
      onSuccess?: () => void,
      skipConfirmation = false
    ) => {
      if (!skipConfirmation) {
        const confirmed = await confirmDelete(itemName);
        if (!confirmed) return { success: false, cancelled: true };
      }

      const result = await executeDelete(apiCall, itemName);
      if (result.success && onSuccess) {
        onSuccess();
      }
      return result;
    }, [executeDelete, confirmDelete]),
  };

  return {
    feedback,
    crud,
    ConfirmationComponent,
  };
}

/**
 * Standard loading states hook
 */
export function useLoadingStates() {
  const states = {
    idle: 'idle',
    loading: 'loading', 
    success: 'success',
    error: 'error'
  } as const;

  type LoadingState = typeof states[keyof typeof states];

  return {
    states,
    isLoading: (state: LoadingState) => state === states.loading,
    isSuccess: (state: LoadingState) => state === states.success,
    isError: (state: LoadingState) => state === states.error,
    isIdle: (state: LoadingState) => state === states.idle,
  };
}

/**
 * Standard form submission hook dengan feedback
 */
export function useFormSubmission<T = unknown>() {
  const { feedback, crud } = useStandardFeedback();
  const { states } = useLoadingStates();

  const submit = useCallback(async (
    apiCall: () => Promise<Response>,
    options?: {
      operation?: 'create' | 'update';
      itemName?: string;
      onSuccess?: (data?: T) => void;
      onError?: (error: unknown) => void;
      successMessage?: string;
      errorMessage?: string;
    }
  ) => {
    const {
      operation = 'create',
      itemName,
      onSuccess,
      onError,
      successMessage,
      errorMessage
    } = options || {};

    try {
      const result = operation === 'create' 
        ? await crud.create(apiCall, itemName, onSuccess)
        : await crud.update(apiCall, itemName, onSuccess);

      if (result.success) {
        if (successMessage) {
          feedback.success(successMessage);
        }
      } else if (result.error && onError) {
        onError(result.error);
      }

      return result;
    } catch (error) {
      if (errorMessage) {
        feedback.error(errorMessage);
      } else if (operation === 'create') {
        feedback.createFailed(itemName);
      } else {
        feedback.updateFailed(itemName);
      }

      if (onError) {
        onError(error);
      }

      return { success: false, error };
    }
  }, [feedback, crud]);

  return { submit, states };
}