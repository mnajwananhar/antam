// Export all custom hooks from this directory
export { useNotification } from "./use-notification";
export type { NotificationMessage, NotificationType } from "./use-notification";
export { useApiNotification } from "./use-api-notification";
export { useSessionWithErrorHandling } from "./use-session-with-error-handling";

// New Toast System Exports
export {
  useToast,
  useToastContext,
  useApiToast,
  useNotificationCompat,
  ToastProvider,
} from "../../components/providers/toast-provider";
export type {
  ToastType,
  ToastMessage,
  UseToastReturn,
  UseApiToastReturn,
} from "../../components/providers/toast-provider";
