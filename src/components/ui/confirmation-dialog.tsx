"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "success";
  isLoading?: boolean;
}

const variantConfig = {
  default: {
    icon: CheckCircle2,
    iconColor: "text-blue-600",
    confirmButtonVariant: "default" as const,
  },
  destructive: {
    icon: Trash2,
    iconColor: "text-red-600",
    confirmButtonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    confirmButtonVariant: "destructive" as const,
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-600",
    confirmButtonVariant: "default" as const,
  },
};

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel", 
  variant = "default",
  isLoading = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-gray-100`}>
              <Icon className={`h-6 w-6 ${config.iconColor}`} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook untuk konfirmasi yang mudah digunakan
export function useConfirmation() {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "warning" | "success";
  } | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);

  const confirm = React.useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive" | "warning" | "success";
  }) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        variant: options.variant,
        onConfirm: async () => {
          setIsLoading(true);
          try {
            resolve(true);
          } finally {
            setIsLoading(false);
            setDialog(null);
          }
        },
      });
    });
  }, []);

  const confirmDelete = React.useCallback((itemName?: string) => {
    return confirm({
      title: "Confirm Delete",
      message: `Are you sure you want to delete ${itemName || "this item"}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
  }, [confirm]);

  const closeDialog = React.useCallback(() => {
    setDialog(null);
    setIsLoading(false);
  }, []);

  const ConfirmationComponent = React.useMemo(() => {
    if (!dialog) return null;

    return (
      <ConfirmationDialog
        isOpen={dialog.isOpen}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        variant={dialog.variant}
        isLoading={isLoading}
      />
    );
  }, [dialog, isLoading, closeDialog]);

  return {
    confirm,
    confirmDelete,
    ConfirmationComponent,
  };
}