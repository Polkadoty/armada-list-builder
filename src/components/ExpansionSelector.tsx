import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useEffect, useState } from "react";
import { Box, Trash2, X } from "lucide-react";
import { LoadingScreen } from "./LoadingScreen";

interface Expansion {
  id: string;
  name: string;
  release: string;
  expansion: string;
  fleet?: string;
}

interface ExpansionSelectorProps {
  onSelectExpansion: (fleet: string) => void;
  onClearFleet: () => void;
  hasFleet: boolean;
  isExpansionMode: boolean;
  setExpansionMode: (mode: boolean) => void;
}

export function ExpansionSelector({ 
  onSelectExpansion, 
  onClearFleet, 
  hasFleet, 
  isExpansionMode,
  setExpansionMode
}: ExpansionSelectorProps) {
  const [expansions, setExpansions] = useState<Record<string, Expansion>>({});
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadExpansions = () => {
      const cachedExpansions = localStorage.getItem("expansions");
      if (cachedExpansions) {
        const data = JSON.parse(cachedExpansions);
        if (data?.expansions) {
          setExpansions(data.expansions);
        }
      }
    };
    loadExpansions();
  }, []);

  const handleSelect = async (expansion: Expansion) => {
    if (expansion.fleet) {
      setShowDialog(false);
      setLoading(true);
      setExpansionMode(true);
      
      // Import fleet immediately
      onSelectExpansion(expansion.fleet.replace(/\\n/g, '\n'));

      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 100);

      // Show loading screen for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLoading(false);
      setProgress(0);
    }
  };

  const handleClearAll = () => {
    onClearFleet();
    setExpansionMode(false);
    setShowDialog(false);
  };

  return (
    <>
      {!isExpansionMode && (
        <Card className="mb-4">
          <Button
            className="w-full justify-between bg-white/30 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md text-lg py-6"
            variant="outline"
            onClick={() => setShowDialog(true)}
          >
            <span className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              PRINT & PLAY EXPANSION
            </span>
          </Button>
        </Card>
      )}

      {hasFleet && isExpansionMode && (
        <Card className="mb-4">
          <Button
            className="w-full justify-between bg-red-500/10 hover:bg-red-500/20 text-red-500 backdrop-blur-md text-lg py-6"
            variant="outline"
            onClick={handleClearAll}
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              SELECT NEW EXPANSION
            </span>
          </Button>
        </Card>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Select Expansion to Print & Play</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDialog(false)}
                className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[60vh] mb-4">
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(expansions).map(([key, expansion]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="w-full text-left justify-start"
                    onClick={() => handleSelect(expansion)}
                  >
                    {expansion.expansion}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      )}

      {loading && <LoadingScreen progress={progress} message="Loading expansion..." />}
    </>
  );
} 