import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

interface FleetRecoveryPopupProps {
  onImport: () => void;
  onDecline: () => void;
  isOpen: boolean;
}

export function FleetRecoveryPopup({
  onImport,
  onDecline,
  isOpen,
}: FleetRecoveryPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recover Previous Fleet</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDecline}
            className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Would you like to recover your previously unsaved fleet?
        </p>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onDecline}>
            No, Start Fresh
          </Button>
          <Button onClick={onImport}>
            Yes, Recover Fleet
          </Button>
        </div>
      </Card>
    </div>
  );
}