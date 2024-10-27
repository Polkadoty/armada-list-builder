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
  message, 
  onClose, 
  showConfirmButton = false,
  onConfirm,
  title = "Notification"
}: NotificationWindowProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
          </Button>
        </DialogHeader>
        <div className="py-4">{message}</div>
        {showConfirmButton && onConfirm && (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
