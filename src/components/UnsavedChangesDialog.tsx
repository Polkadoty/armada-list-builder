import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function UnsavedChangesDialog({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
  title = "Unsaved Changes",
  description = "You have unsaved changes to your fleet. Would you like to save before leaving?"
}: UnsavedChangesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onDiscard}
            className="flex-1 sm:flex-initial"
          >
            Discard Changes
          </Button>
          <Button 
            onClick={onSave}
            className="flex-1 sm:flex-initial"
          >
            Save Fleet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}