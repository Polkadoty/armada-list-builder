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
      <Card className="w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg border border-zinc-200 dark:border-zinc-700">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {title || "Notification"}
          </h2>
        </div>
        <div className="p-4">
          <p className="text-zinc-900 dark:text-white">{message}</p>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700">
          {showConfirmButton && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/50 dark:bg-zinc-900/50 text-red-600 dark:text-red-400 hover:bg-opacity-20 backdrop-blur-md border-zinc-200 dark:border-zinc-700"
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
            className="bg-white/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md border-zinc-200 dark:border-zinc-700"
            onClick={onClose}
          >
            {showConfirmButton ? "Cancel" : "Close"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
