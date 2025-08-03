import { X, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NotificationMessage,
  NotificationType,
} from "@/lib/hooks/use-notification";

interface NotificationProps {
  notification: NotificationMessage;
  onClose?: () => void;
  className?: string;
}

/**
 * Komponen untuk menampilkan notifikasi
 *
 * Mengikuti prinsip:
 * - Single Responsibility: Hanya menangani tampilan notifikasi
 * - Open/Closed: Mudah diperluas dengan type notifikasi baru
 * - Interface Segregation: Props yang minimal dan spesifik
 *
 * @example
 * ```tsx
 * <NotificationDisplay
 *   notification={{
 *     type: "success",
 *     title: "Berhasil",
 *     message: "Data telah disimpan"
 *   }}
 *   onClose={() => clearNotification()}
 * />
 * ```
 */
export function NotificationDisplay({
  notification,
  onClose,
  className,
}: NotificationProps) {
  const getVariant = (type: NotificationType) => {
    switch (type) {
      case "error":
        return "destructive";
      case "warning":
        return "default"; // You can create custom variant for warning
      default:
        return "default";
    }
  };

  const getIcon = (type: NotificationType) => {
    const iconClass = "h-4 w-4";

    switch (type) {
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

  const getBackgroundColor = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950";
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950";
      case "info":
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950";
      default:
        return ""; // Use default Alert styling for error
    }
  };

  return (
    <Alert
      variant={getVariant(notification.type)}
      className={cn(
        "relative",
        notification.type !== "error" && getBackgroundColor(notification.type),
        className
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon(notification.type)}

        <div className="flex-1 min-w-0">
          {notification.title && (
            <AlertTitle className="mb-1 text-sm font-semibold">
              {notification.title}
            </AlertTitle>
          )}
          <AlertDescription className="text-sm">
            {notification.message}
          </AlertDescription>
        </div>

        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-transparent opacity-70 hover:opacity-100"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Tutup notifikasi</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}

/**
 * Container untuk notifikasi yang dapat digunakan di berbagai tempat
 *
 * @example
 * ```tsx
 * const { notification, clearNotification } = useNotification();
 *
 * return (
 *   <div>
 *     <NotificationContainer
 *       notification={notification}
 *       onClose={clearNotification}
 *     />
 *   </div>
 * );
 * ```
 */
export function NotificationContainer({
  notification,
  onClose,
  className,
}: {
  notification: NotificationMessage | null;
  onClose?: () => void;
  className?: string;
}) {
  if (!notification) return null;

  return (
    <div className={cn("mb-4", className)}>
      <NotificationDisplay notification={notification} onClose={onClose} />
    </div>
  );
}
