import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={isOpen}>
      <DialogContent className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg">
        <DialogHeader>
          <DialogTitle>Recover Previous Fleet</DialogTitle>
          <DialogDescription>
            Would you like to recover your previously unsaved fleet?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onDecline}>
            No, Start Fresh
          </Button>
          <Button onClick={onImport}>Yes, Recover Fleet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}