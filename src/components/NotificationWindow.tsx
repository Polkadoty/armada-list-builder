import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface NotificationWindowProps {
  message: string;
  onClose: () => void;
}

export const NotificationWindow: React.FC<NotificationWindowProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <p className="text-center text-gray-800 dark:text-gray-200">{message}</p>
        <div className="mt-4 flex justify-center">
          <Button onClick={onClose}>OK</Button>
        </div>
      </div>
    </div>
  );
};
