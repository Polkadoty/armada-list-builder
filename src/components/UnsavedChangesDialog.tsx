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
import { AlertTriangle, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

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
  const { theme } = useTheme();
  const { user } = useUser();

  // If user is not signed in, show sign-in prompt
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className={`sm:max-w-[425px] backdrop-blur-md ${
          theme === 'light' 
            ? 'bg-white/95 text-zinc-900 border-zinc-200' 
            : 'bg-zinc-900/90 text-white border-zinc-700'
        }`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${
              theme === 'light' ? 'text-zinc-900' : 'text-white'
            }`}>
              <User className="h-5 w-5 text-blue-500" />
              Sign In Required
            </DialogTitle>
            <DialogDescription className={
              theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
            }>
              You need to sign in to save your fleet. Sign in now to keep your progress, or continue without saving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1 sm:flex-initial"
            >
              Continue Editing
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDiscard}
              className="flex-1 sm:flex-initial"
            >
              Continue Without Saving
            </Button>
            <Button 
              asChild
              className="flex-1 sm:flex-initial"
            >
              <Link href="/api/auth/login">
                Sign In
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // If user is signed in, show normal save/discard options
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className={`sm:max-w-[425px] backdrop-blur-md ${
        theme === 'light' 
          ? 'bg-white/95 text-zinc-900 border-zinc-200' 
          : 'bg-zinc-900/90 text-white border-zinc-700'
      }`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${
            theme === 'light' ? 'text-zinc-900' : 'text-white'
          }`}>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {title}
          </DialogTitle>
          <DialogDescription className={
            theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
          }>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 sm:flex-initial"
          >
            Continue Editing
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