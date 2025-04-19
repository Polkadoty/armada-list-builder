import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NotificationWindowProps {
  message: string;
  onClose: () => void;
  title?: string;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
}

export function NotificationWindow({
  message,
  onClose,
  title,
  showConfirmButton = false,
  onConfirm,
}: NotificationWindowProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30">
      <Card className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title || "Notification"}
          </h2>
        </div>
        <div className="p-4">
          <p className="text-gray-900 dark:text-white">{message}</p>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          {showConfirmButton && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/50 dark:bg-gray-900/50 text-red-600 dark:text-red-400 hover:bg-opacity-20 backdrop-blur-md border-gray-200 dark:border-gray-700"
              onClick={() => {
                onConfirm?.();
                onClose();
              }}
            >
              Confirm
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md border-gray-200 dark:border-gray-700"
            onClick={onClose}
          >
            {showConfirmButton ? "Cancel" : "Close"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
