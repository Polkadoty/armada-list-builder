// src/components/PrintMenu.tsx
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { List, Grid } from "lucide-react";

interface PrintMenuProps {
  onPrintList: () => void;
  onPrintnPlay: () => void;
  onClose: () => void;
  paperSize: 'letter' | 'a4';
  setPaperSize: (size: 'letter' | 'a4') => void;
  showRestrictions: boolean;
  setShowRestrictions: (show: boolean) => void;
  showObjectives: boolean;
  setShowObjectives: (show: boolean) => void;
  showCardBacks: boolean;
  setShowCardBacks: (show: boolean) => void;
  showDamageDeck: boolean;
  setShowDamageDeck: (show: boolean) => void;
}

export function PrintMenu({ 
  onPrintList, 
  onPrintnPlay, 
  onClose, 
  paperSize, 
  setPaperSize,
  showRestrictions,
  setShowRestrictions,
  showObjectives,
  setShowObjectives,
  showCardBacks,
  setShowCardBacks,
  showDamageDeck,
  setShowDamageDeck
}: PrintMenuProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card className="w-80 p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Print Options</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Paper Size</h3>
            <div className="flex gap-2">
              <Button 
                variant={paperSize === 'letter' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaperSize('letter')}
              >
                Letter
              </Button>
              <Button 
                variant={paperSize === 'a4' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setPaperSize('a4')}
              >
                A4
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Include in List</h3>
            <div className="flex gap-2">
              <Button 
                variant={showRestrictions ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setShowRestrictions(!showRestrictions)}
              >
                Restrictions
              </Button>
              <Button 
                variant={showObjectives ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setShowObjectives(!showObjectives)}
              >
                Objectives
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Card Backs</h3>
            <div className="flex gap-2">
              <Button 
                variant={showCardBacks ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setShowCardBacks(true)}
              >
                Show Backs
              </Button>
              <Button 
                variant={!showCardBacks ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setShowCardBacks(false)}
              >
                Hide Backs
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Damage Deck</h3>
            <div className="flex gap-2">
              <Button 
                variant={showDamageDeck ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setShowDamageDeck(true)}
              >
                Include
              </Button>
              <Button 
                variant={!showDamageDeck ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setShowDamageDeck(false)}
              >
                Exclude
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-yellow-600">
              <span className="mr-2">⚠️</span>
              <span className="text-sm">Make sure you print at 100% scale to get the right sizing.</span>
            </div>
            <Button 
              className="w-full flex items-center justify-between" 
              variant="outline"
              onClick={onPrintList}
            >
              <span>Print List</span>
              <List className="h-4 w-4" />
            </Button>
            <Button 
              className="w-full flex items-center justify-between" 
              variant="outline"
              onClick={onPrintnPlay}
            >
              <span>Print & Play Cards</span>
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}