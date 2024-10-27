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
      <DialogContent>
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