import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ListPlus, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Cookies from 'js-cookie';
import { flushCacheAndReload } from '../utils/dataFetcher';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select";
import ContentAdditionWindow from './ContentAdditionWindow';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isUserWhitelistedForLegacyBeta } from '../utils/whitelist';
import { debugWhitelistSystem } from '../utils/whitelistAdmin';

// Configuration flags
const CONFIG = {
  showLegacyToggle: true,
  showLegendsToggle: true,
  showNexusToggle: true,
  showLegacyBetaToggle: true,
  showArcToggle: false,
  showLocalContentToggle: false,
  showProxyToggle: false,
  showCustomFactionsToggle: false,
  showAMGToggle: false
};

export function ContentToggleButton({ setIsLoading, setLoadingProgress, setLoadingMessage, gamemode, setGamemode }: {
  setIsLoading: (isLoading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingMessage: (message: string) => void;
  gamemode: string;
  setGamemode: (mode: string) => void;
}) {
  const [enableLegacy, setEnableLegacy] = useState(false);
  const [enableLegacyBeta, setEnableLegacyBeta] = useState(false);
  const [enableArc, setEnableArc] = useState(false);
  const [enableLegends, setEnableLegends] = useState(false);
  const [enableProxy, setEnableProxy] = useState(false);
  const [enableNexus, setEnableNexus] = useState(false);
  const [isLegacyBetaWhitelisted, setIsLegacyBetaWhitelisted] = useState(false);
  // const [enableAMG, setEnableAMG] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [selectedGamemode, setSelectedGamemode] = useState<string>(gamemode || "Standard");
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const legacyCookie = Cookies.get('enableLegacy');
    const legacyBetaCookie = Cookies.get('enableLegacyBeta');
    const arcCookie = Cookies.get('enableArc');
    const legendsCookie = Cookies.get('enableLegends');
    const proxyCookie = Cookies.get('enableProxy');
    const nexusCookie = Cookies.get('enableNexus');
    // const amgCookie = Cookies.get('enableAMG');
    setEnableLegacy(CONFIG.showLegacyToggle && legacyCookie === 'true');
    setEnableLegacyBeta(CONFIG.showLegacyBetaToggle && legacyBetaCookie === 'true');
    setEnableArc(CONFIG.showArcToggle && arcCookie === 'true');
    setEnableLegends(CONFIG.showLegendsToggle && legendsCookie === 'true');
    setEnableProxy(CONFIG.showProxyToggle && proxyCookie === 'true');
    setEnableNexus(nexusCookie === 'true');
    // setEnableAMG(CONFIG.showAMGToggle && amgCookie !== 'false');
  }, []);

  // Check if user is whitelisted for LegacyBeta
  useEffect(() => {
    const checkWhitelist = async () => {
      console.log('DEBUG: Checking whitelist for user:', user?.sub);
      
      // Run debug system check
      await debugWhitelistSystem(user?.sub ?? undefined);
      
      if (user?.sub) {
        console.log('DEBUG: User sub exists, calling isUserWhitelistedForLegacyBeta');
        const whitelisted = await isUserWhitelistedForLegacyBeta(user.sub);
        console.log('DEBUG: Whitelist result:', whitelisted);
        setIsLegacyBetaWhitelisted(whitelisted);
      } else {
        console.log('DEBUG: No user.sub, setting whitelisted to false');
        setIsLegacyBetaWhitelisted(false);
      }
    };

    if (mounted) {
      console.log('DEBUG: Component mounted, checking whitelist');
      checkWhitelist();
    }
  }, [user?.sub, mounted]);

  useEffect(() => {
    setSelectedGamemode(gamemode);
  }, [gamemode]);

  useEffect(() => {
    setGamemode(selectedGamemode);
  }, [selectedGamemode]);

  useEffect(() => {
    if (infoOpen) setPopoverOpen(false);
  }, [infoOpen]);

  // DEBUG: Log toggle visibility conditions
  useEffect(() => {
    console.log('DEBUG: Legacy Beta toggle visibility check:', {
      showLegacyBetaToggle: CONFIG.showLegacyBetaToggle,
      isLegacyBetaWhitelisted,
      shouldShow: CONFIG.showLegacyBetaToggle && isLegacyBetaWhitelisted
    });
  }, [isLegacyBetaWhitelisted]);

  if (!mounted) {
    return null;
  }

  const isDarkTheme = theme === 'dark' || resolvedTheme === 'dark';

  // const handleAMGToggle = (checked: boolean) => {
  //   if (CONFIG.showAMGToggle) {
  //     setEnableAMG(checked);
  //     Cookies.set('enableAMG', checked.toString(), { expires: 365 });
  //     flushCacheAndReload(() => {}, () => {}, () => {});
  //   }
  // };

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
      if (!checked) {
        setEnableLegends(false);
        Cookies.set('enableLegends', 'false', { expires: 365 });
      }
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleLegacyBetaToggle = (checked: boolean) => {
    if (CONFIG.showLegacyBetaToggle) {
      setEnableLegacyBeta(checked);
      Cookies.set('enableLegacyBeta', checked.toString(), { expires: 365 });
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

  const handleProxyToggle = (checked: boolean) => {
    if (CONFIG.showProxyToggle) {
      setEnableProxy(checked);
      Cookies.set('enableProxy', checked.toString(), { expires: 365 });
      flushCacheAndReload(() => {}, () => {}, () => {});
    }
  };

  const handleNexusToggle = (checked: boolean) => {
    setEnableNexus(checked);
    Cookies.set('enableNexus', checked.toString(), { expires: 365 });
    flushCacheAndReload(() => {}, () => {}, () => {});
  };

  const handleFlushCache = async () => {
    await flushCacheAndReload(setIsLoading, setLoadingProgress, setLoadingMessage);
  };

  return (
    <>
      <Tooltip>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md">
                <ListPlus className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all ${isDarkTheme ? 'text-white' : 'text-zinc-900'}`} />
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
              <div className="grid gap-3">
                {/* Gamemode Dropdown */}
                <div className="mt-4">
                  <h5 className="font-semibold text-sm mb-3">Gamemode</h5>
                  <Select value={selectedGamemode} onValueChange={setSelectedGamemode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a gamemode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Gamemode</SelectLabel>
                        <SelectItem value="Task Force">Task Force</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Sector Fleet">Sector Fleet</SelectItem>
                        <SelectItem value="Monster Trucks">Monster Trucks</SelectItem>
                        <SelectItem value="Campaign">Campaign</SelectItem>
                        <SelectItem value="Fighter Group">Fighter Group</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Core Content Section */}
                <div className="mt-4">
                  <h5 className="font-semibold text-sm mb-3">Core Content</h5>
                  {CONFIG.showLegacyToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="legacy-toggle" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Enable Legacy Content
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('legacy'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="legacy-toggle"
                        checked={enableLegacy}
                        onCheckedChange={handleLegacyToggle}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showArcToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="arc-toggle" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Enable Arc Tournament Content (Beta)
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('arc'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="arc-toggle"
                        checked={enableArc}
                        onCheckedChange={handleArcToggle}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showNexusToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="nexus-toggle" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Enable Nexus Content
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('nexus'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="nexus-toggle"
                        checked={enableNexus}
                        onCheckedChange={handleNexusToggle}
                        className="custom-switch"
                      />
                    </div>
                  )}
                </div>

                {/* Experimental Content Section */}
                <div className="mt-4">
                  <h5 className="font-semibold text-sm mb-3">Experimental Content</h5>
                  {CONFIG.showLegendsToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="legends-toggle" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Enable Legends Content
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('legends'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="legends-toggle"
                        checked={enableLegends}
                        onCheckedChange={handleLegendsToggle}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showLegacyBetaToggle && isLegacyBetaWhitelisted && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="legacy-beta-toggle" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Enable Legacy Beta Content
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('legacy-beta'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="legacy-beta-toggle"
                        checked={enableLegacyBeta}
                        onCheckedChange={handleLegacyBetaToggle}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showProxyToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="proxy-toggle" className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Enable Card Proxies
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('proxy'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="proxy-toggle"
                        checked={enableProxy}
                        onCheckedChange={handleProxyToggle}
                        className="custom-switch"
                      />
                    </div>
                  )}
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
      {infoOpen && (
        <ContentAdditionWindow
          contentType={infoOpen}
          onClose={() => setInfoOpen(null)}
        />
      )}
    </>
  );
}
