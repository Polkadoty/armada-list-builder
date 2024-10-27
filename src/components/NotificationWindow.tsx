import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NotificationWindowProps {
  message: string;
  onClose: () => void;
  showConfirmButton?: boolean;
  onConfirm?: () => void;
  title?: string;
}

export function NotificationWindow({
  title,
  message,
  onClose,
  showConfirmButton = false,
  onConfirm
}: NotificationWindowProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-white bg-opacity-30 backdrop-blur-md dark:bg-gray-800 dark:bg-opacity-30 p-6 rounded-lg shadow-lg max-w-md w-full">
        {title && (
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-4">{title}</DialogTitle>
          </DialogHeader>
        )}
        <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          {showConfirmButton && (
            <Button
              onClick={onConfirm}
              variant="destructive"
            >
              Yes
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
          >
            {showConfirmButton ? 'No' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
