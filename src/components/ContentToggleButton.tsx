import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ListPlus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Cookies from 'js-cookie';
import { flushCacheAndReload } from '../utils/dataFetcher';

// Configuration flags
const CONFIG = {
  showLegacyToggle: true,
  showLegendsToggle: true,
  showOldLegacyToggle: true,
  showArcToggle: true,
  showLocalContentToggle: false,
  showProxyToggle: false,
  showCustomFactionsToggle: true,
  showAMGToggle: true
};

export function ContentToggleButton({ setIsLoading, setLoadingProgress, setLoadingMessage, tournamentMode, setTournamentMode }: {
  setIsLoading: (isLoading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingMessage: (message: string) => void;
  tournamentMode: boolean;
  setTournamentMode: (mode: boolean) => void;
}) {
  const [enableLegacy, setEnableLegacy] = useState(false);
  const [enableLegends, setEnableLegends] = useState(false);
  const [enableOldLegacy, setEnableOldLegacy] = useState(false);
  const [enableArc, setEnableArc] = useState(false);
  const [enableCustomFactions, setEnableCustomFactions] = useState(false);
  const [enableLocalContent, setEnableLocalContent] = useState(false);
  const [enableProxy, setEnableProxy] = useState(false);
  const [enableAMG, setEnableAMG] = useState(true);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const legacyCookie = Cookies.get('enableLegacy');
    const legendsCookie = Cookies.get('enableLegends');
    const oldLegacyCookie = Cookies.get('enableOldLegacy');
    const arcCookie = Cookies.get('enableArc');
    const customFactionsCookie = Cookies.get('enableCustomFactions');
    const localContentCookie = Cookies.get('enableLocalContent');
    const proxyCookie = Cookies.get('enableProxy');
    const amgCookie = Cookies.get('enableAMG');
    setEnableLegacy(CONFIG.showLegacyToggle && legacyCookie === 'true');
    setEnableLegends(CONFIG.showLegendsToggle && legendsCookie === 'true');
    setEnableOldLegacy(CONFIG.showOldLegacyToggle && oldLegacyCookie === 'true');
    setEnableArc(CONFIG.showArcToggle && arcCookie === 'true');
    setEnableCustomFactions(CONFIG.showCustomFactionsToggle && customFactionsCookie === 'true');
    setEnableLocalContent(CONFIG.showLocalContentToggle && localContentCookie === 'true');
    setEnableProxy(CONFIG.showProxyToggle && proxyCookie === 'true');
    setEnableAMG(CONFIG.showAMGToggle && amgCookie === 'true');
  }, []);

  if (!mounted) {
    return null;
  }

  const isDarkTheme = theme === 'dark' || resolvedTheme === 'dark';

  const handleAMGToggle = (checked: boolean) => {
    if (CONFIG.showAMGToggle) {
      setEnableAMG(checked);
      Cookies.set('enableAMG', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleLegacyToggle = (checked: boolean) => {
    if (CONFIG.showLegacyToggle) {
      setEnableLegacy(checked);
      Cookies.set('enableLegacy', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleLegendsToggle = (checked: boolean) => {
    if (CONFIG.showLegendsToggle) {
      setEnableLegends(checked);
      Cookies.set('enableLegends', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleOldLegacyToggle = (checked: boolean) => {
    if (CONFIG.showOldLegacyToggle) {
      setEnableOldLegacy(checked);
      Cookies.set('enableOldLegacy', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleArcToggle = (checked: boolean) => {
    if (CONFIG.showArcToggle) {
      setEnableArc(checked);
      Cookies.set('enableArc', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleLocalContentToggle = (checked: boolean) => {
    if (CONFIG.showLocalContentToggle) {
      setEnableLocalContent(checked);
      Cookies.set('enableLocalContent', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleProxyToggle = (checked: boolean) => {
    if (CONFIG.showProxyToggle) {
      setEnableProxy(checked);
      Cookies.set('enableProxy', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleCustomFactionsToggle = (checked: boolean) => {
    if (CONFIG.showCustomFactionsToggle) {
      setEnableCustomFactions(checked);
      Cookies.set('enableCustomFactions', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };



  const handleFlushCache = async () => {
    await flushCacheAndReload(setIsLoading, setLoadingProgress, setLoadingMessage);
  };

  return (
    <Tooltip>
      <Popover>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background">
              <ListPlus className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all ${isDarkTheme ? 'text-white' : 'text-gray-900'}`} />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none logo-font">Content Settings</h4>
              <p className="text-sm text-muted-foreground">
                Toggle additional content for your fleet builder.
              </p>
            </div>
            <div className="grid gap-2">
              {CONFIG.showAMGToggle && (
                <div className="flex items-center justify-between">
                  <label htmlFor="amg-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable AMG Errata
                  </label>
                  <Switch
                    id="amg-toggle"
                    checked={enableAMG}
                    onCheckedChange={handleAMGToggle}
                    className="custom-switch"
                  />
                </div>
              )}
              {CONFIG.showLegacyToggle && (
                <div className="flex items-center justify-between">
                  <label htmlFor="legacy-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable Legacy Content (Beta)
                  </label>
                  <Switch
                    id="legacy-toggle"
                    checked={enableLegacy}
                    onCheckedChange={handleLegacyToggle}
                    className="custom-switch"
                  />
                </div>
              )}
              {CONFIG.showLegendsToggle && (
                <div className="flex items-center justify-between">
                  <label htmlFor="legends-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable Legends Content
                  </label>
                  <Switch
                    id="legends-toggle"
                    checked={enableLegends}
                    onCheckedChange={handleLegendsToggle}
                    className="custom-switch"
                  />
                </div>
              )}

              {CONFIG.showArcToggle && (
                <div className="flex items-center justify-between">
                  <label htmlFor="arc-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable Arc Tournament Content (Beta)
                  </label>
                  <Switch
                    id="arc-toggle"
                    checked={enableArc}
                    onCheckedChange={handleArcToggle}
                    className="custom-switch"
                  />
                </div>
              )}
              {CONFIG.showLocalContentToggle && (
                <div className="flex items-center justify-between">
                  <label htmlFor="local-content-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable Local Content
                  </label>
                  <Switch
                    id="local-content-toggle"
                    checked={enableLocalContent}
                    onCheckedChange={handleLocalContentToggle}
                    className="custom-switch"
                  />
                </div>
              )}
              {CONFIG.showProxyToggle && (
                <div className="flex items-center justify-between">
                  <label htmlFor="proxy-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable Card Proxies
                  </label>
                  <Switch
                    id="proxy-toggle"
                    checked={enableProxy}
                    onCheckedChange={handleProxyToggle}
                    className="custom-switch"
                  />
                </div>
              )}

              {CONFIG.showCustomFactionsToggle && (
                <div className="flex items-center justify-between">
                  <label htmlFor="custom-factions-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable Custom Factions
                  </label>
                  <Switch
                    id="custom-factions-toggle"
                    checked={enableCustomFactions}
                    onCheckedChange={handleCustomFactionsToggle}
                    className="custom-switch"
                  />
                </div>
              )}
              {CONFIG.showOldLegacyToggle && (
                <div className="flex items-center justify-between">
                  <label htmlFor="old-legacy-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable Deprecated Legacy Content
                  </label>
                  <Switch
                    id="old-legacy-toggle"
                    checked={enableOldLegacy}
                    onCheckedChange={handleOldLegacyToggle}
                    className="custom-switch"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <label htmlFor="tournament-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Tournament Mode
                </label>
                <Switch
                  id="tournament-mode"
                  checked={tournamentMode}
                  onCheckedChange={setTournamentMode}
                  className="custom-switch"
                />
              </div>
              <Button onClick={handleFlushCache} variant="outline" size="sm" className="mt-2">
                Flush Cache and Reload
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Tip: Press Ctrl+Shift+R if you&apos;re still seeing old images
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <TooltipContent>
        <p>Toggle additional content</p>
      </TooltipContent>
    </Tooltip>
  );
}
