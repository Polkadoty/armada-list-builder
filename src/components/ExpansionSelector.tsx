import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useEffect, useState, useCallback } from "react";
import { Box, Trash2, X } from "lucide-react";
import { LoadingScreen } from "./LoadingScreen";
import Cookies from 'js-cookie';

interface Expansion {
  id: string;
  name: string;
  release: string;
  expansion: string;
  fleet?: string;
  alias?: string;
}

interface Release {
  id: string;
  name: string;
  release: string;
  expansion: string;
  fleet?: string;
  alias?: string;
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
  const [displayedExpansions, setDisplayedExpansions] = useState<Record<string, Expansion>>({});
  const [displayedReleases, setDisplayedReleases] = useState<Record<string, Release>>({});
  const [showExpansionDialog, setShowExpansionDialog] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [contentSources, setContentSources] = useState({
    arc: Cookies.get('enableArc') === 'true',
    legacy: Cookies.get('enableLegacy') === 'true',
    legends: Cookies.get('enableLegends') === 'true',
    legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
    arcBeta: Cookies.get('enableArcBeta') === 'true',
    nexus: Cookies.get('enableNexus') === 'true',
    naboo: Cookies.get('enableNaboo') === 'true'
  });

  // Load and filter expansions
  const loadExpansions = useCallback(() => {
    const cachedExpansions = localStorage.getItem("expansions");
    if (cachedExpansions) {
      const data = JSON.parse(cachedExpansions);
      if (data?.expansions) {
        const filtered = Object.entries(data.expansions).reduce((acc, [key, expansion]) => {
          const alias = (expansion as Expansion).alias?.toLowerCase();
          
          if (!alias || alias === 'ffg' || alias === 'amg') {
            acc[key] = expansion as Expansion;
            return acc;
          }

          if (alias === 'legacy' && contentSources.legacy) {
            acc[key] = expansion as Expansion;
            return acc;
          }

          if (alias === 'legends' && contentSources.legends) {
            acc[key] = expansion as Expansion;
            return acc;
          }

          if (alias === 'nexus' && contentSources.nexus) {
            acc[key] = expansion as Expansion;
            return acc;
          }

          return acc;
        }, {} as Record<string, Expansion>);

        setDisplayedExpansions(filtered);
      }
    }
  }, [contentSources]);

  // Load and filter releases
  const loadReleases = useCallback(() => {
    const cachedReleases = localStorage.getItem("releases");
    if (cachedReleases) {
      const data = JSON.parse(cachedReleases);
      if (data?.releases) {
        const filtered = Object.entries(data.releases).reduce((acc, [key, release]) => {
          const alias = (release as Release).alias?.toLowerCase();
          
          if (!alias || alias === 'ffg' || alias === 'amg') {
            acc[key] = release as Release;
            return acc;
          }

          if (alias === 'legacy' && contentSources.legacy) {
            acc[key] = release as Release;
            return acc;
          }

          if (alias === 'legends' && contentSources.legends) {
            acc[key] = release as Release;
            return acc;
          }

          if (alias === 'nexus' && contentSources.nexus) {
            acc[key] = release as Release;
            return acc;
          }

          return acc;
        }, {} as Record<string, Release>);

        setDisplayedReleases(filtered);
      }
    }
  }, [contentSources]);

  // Check cookies and update content sources
  useEffect(() => {
    const checkCookies = () => {
      const newContentSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
        arcBeta: Cookies.get('enableArcBeta') === 'true',
        nexus: Cookies.get('enableNexus') === 'true',
        naboo: Cookies.get('enableNaboo') === 'true'
      };

      if (JSON.stringify(newContentSources) !== JSON.stringify(contentSources)) {
        setContentSources(newContentSources);
        loadExpansions(); // Reload expansions when content sources change
      }
    };

    checkCookies();
    const interval = setInterval(checkCookies, 1000);
    return () => clearInterval(interval);
  }, [contentSources, loadExpansions]);

  // Initial load of expansions
  useEffect(() => {
    loadExpansions();
  }, [loadExpansions]);

  // Initial load of releases
  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  const handleSelect = async (expansion: Expansion | Release) => {
    if (expansion.fleet) {
      setShowExpansionDialog(false);
      setShowReleaseDialog(false);
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
    setShowExpansionDialog(false);
    setShowReleaseDialog(false);
  };

  return (
    <>
      {!isExpansionMode && (
        <>
          <Card className="mb-4">
            <Button
              className="w-full justify-between bg-white/30 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md text-lg py-6"
              variant="outline"
              onClick={() => setShowExpansionDialog(true)}
            >
              <span className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                PRINT & PLAY EXPANSION
              </span>
            </Button>
          </Card>
          <Card className="mb-4">
            <Button
              className="w-full justify-between bg-white/30 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md text-lg py-6"
              variant="outline"
              onClick={() => setShowReleaseDialog(true)}
            >
              <span className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                PRINT & PLAY SHIPS
              </span>
            </Button>
          </Card>
        </>
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

      {showExpansionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Select Expansion to Print & Play</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExpansionDialog(false)}
                className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[60vh] mb-4">
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(displayedExpansions).map(([key, expansion]) => (
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

      {showReleaseDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Select Ships to Print & Play</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReleaseDialog(false)}
                className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[60vh] mb-4">
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(displayedReleases).map(([key, release]) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="w-full text-left justify-start"
                    onClick={() => handleSelect(release)}
                  >
                    {release.expansion}
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