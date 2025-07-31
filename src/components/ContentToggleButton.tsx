import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ListPlus, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Cookies from 'js-cookie';
import { forceReloadContent } from '../utils/contentManager';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectLabel, SelectGroup } from "@/components/ui/select";
import ContentAdditionWindow from './ContentAdditionWindow';
import { useUser } from '@auth0/nextjs-auth0/client';
import { isUserWhitelistedForLegacyBeta, isUserWhitelistedForArcBeta } from '../utils/whitelist';
import { getRestrictionsForGamemode, type Gamemode } from '../utils/gamemodeRestrictions';

// Configuration flags
const CONFIG = {
  showLegacyToggle: true,
  showLegendsToggle: true,
  showNexusToggle: true,
  showLegacyBetaToggle: true,
  showArcToggle: true,
  showArcBetaToggle: true,
  showNabooToggle: true,
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
  const [enableArcBeta, setEnableArcBeta] = useState(false);
  const [enableLegends, setEnableLegends] = useState(false);
  const [enableProxy, setEnableProxy] = useState(false);
  const [enableNexus, setEnableNexus] = useState(false);
  const [enableNaboo, setEnableNaboo] = useState(false);
  const [isLegacyBetaWhitelisted, setIsLegacyBetaWhitelisted] = useState(false);
  const [isArcBetaWhitelisted, setIsArcBetaWhitelisted] = useState(false);
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
    const arcBetaCookie = Cookies.get('enableArcBeta');
    const legendsCookie = Cookies.get('enableLegends');
    const proxyCookie = Cookies.get('enableProxy');
    const nexusCookie = Cookies.get('enableNexus');
    const nabooCookie = Cookies.get('enableNaboo');
    // const amgCookie = Cookies.get('enableAMG');
    setEnableLegacy(CONFIG.showLegacyToggle && legacyCookie === 'true');
    setEnableLegacyBeta(CONFIG.showLegacyBetaToggle && legacyBetaCookie === 'true');
    setEnableArc(CONFIG.showArcToggle && arcCookie === 'true');
    setEnableArcBeta(CONFIG.showArcBetaToggle && arcBetaCookie === 'true');
    setEnableLegends(CONFIG.showLegendsToggle && legendsCookie === 'true');
    setEnableProxy(CONFIG.showProxyToggle && proxyCookie === 'true');
    setEnableNexus(nexusCookie === 'true');
    setEnableNaboo(CONFIG.showNabooToggle && nabooCookie === 'true');
    // setEnableAMG(CONFIG.showAMGToggle && amgCookie !== 'false');
  }, []);

  // Check if user is whitelisted for LegacyBeta
  useEffect(() => {
    const checkWhitelist = async () => {
      if (user?.sub) {
        const whitelisted = await isUserWhitelistedForLegacyBeta(user.sub);
        setIsLegacyBetaWhitelisted(whitelisted);
      } else {
        setIsLegacyBetaWhitelisted(false);
      }
    };

    if (mounted) {
      checkWhitelist();
    }
  }, [user?.sub, mounted]);

  // Check if user is whitelisted for ArcBeta
  useEffect(() => {
    const checkWhitelist = async () => {
      if (user?.sub) {
        const whitelisted = await isUserWhitelistedForArcBeta(user.sub);
        setIsArcBetaWhitelisted(whitelisted);
      } else {
        setIsArcBetaWhitelisted(false);
      }
    };

    if (mounted) {
      checkWhitelist();
    }
  }, [user?.sub, mounted]);

  useEffect(() => {
    setSelectedGamemode(gamemode);
  }, [gamemode]);

  useEffect(() => {
    setGamemode(selectedGamemode);
  }, [selectedGamemode, setGamemode]);

  // Watch for localStorage changes and update gamemode accordingly
  useEffect(() => {
    const checkGamemodeChanges = () => {
      const storedGamemode = localStorage.getItem('selectedGamemode');
      if (storedGamemode && storedGamemode !== selectedGamemode) {
        console.log('Gamemode changed in localStorage, updating to:', storedGamemode);
        setSelectedGamemode(storedGamemode);
      }
    };

    // Check periodically for localStorage changes
    const interval = setInterval(checkGamemodeChanges, 500);
    
    // Also check on storage events (though these typically only fire for other tabs)
    window.addEventListener('storage', checkGamemodeChanges);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkGamemodeChanges);
    };
  }, [selectedGamemode]);

  // Apply gamemode restrictions when gamemode changes
  useEffect(() => {
    const restrictions = getRestrictionsForGamemode(selectedGamemode as Gamemode);
    const forceToggles = restrictions?.forceToggles;
    
    if (forceToggles) {
      // Apply forced toggle settings
      if (forceToggles.enableLegacy !== undefined) {
        setEnableLegacy(forceToggles.enableLegacy);
        Cookies.set('enableLegacy', forceToggles.enableLegacy.toString(), { expires: 365 });
      }
      
      if (forceToggles.enableLegends !== undefined) {
        setEnableLegends(forceToggles.enableLegends);
        Cookies.set('enableLegends', forceToggles.enableLegends.toString(), { expires: 365 });
      }
      
      if (forceToggles.enableLegacyBeta !== undefined) {
        setEnableLegacyBeta(forceToggles.enableLegacyBeta);
        Cookies.set('enableLegacyBeta', forceToggles.enableLegacyBeta.toString(), { expires: 365 });
      }
      
      if (forceToggles.enableArc !== undefined) {
        setEnableArc(forceToggles.enableArc);
        Cookies.set('enableArc', forceToggles.enableArc.toString(), { expires: 365 });
      }
      
      if (forceToggles.enableArcBeta !== undefined) {
        setEnableArcBeta(forceToggles.enableArcBeta);
        Cookies.set('enableArcBeta', forceToggles.enableArcBeta.toString(), { expires: 365 });
      }
      
      if (forceToggles.enableNexus !== undefined) {
        setEnableNexus(forceToggles.enableNexus);
        Cookies.set('enableNexus', forceToggles.enableNexus.toString(), { expires: 365 });
      }
      
      if (forceToggles.enableProxy !== undefined) {
        setEnableProxy(forceToggles.enableProxy);
        Cookies.set('enableProxy', forceToggles.enableProxy.toString(), { expires: 365 });
      }
      
      if (forceToggles.enableNaboo !== undefined) {
        setEnableNaboo(forceToggles.enableNaboo);
        Cookies.set('enableNaboo', forceToggles.enableNaboo.toString(), { expires: 365 });
      }
      
      // Reload content after forcing toggles if needed
      forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
    }
  }, [selectedGamemode, setIsLoading, setLoadingProgress, setLoadingMessage]);

  useEffect(() => {
    if (infoOpen) setPopoverOpen(false);
  }, [infoOpen]);

  if (!mounted) {
    return null;
  }

  const isDarkTheme = theme === 'dark' || resolvedTheme === 'dark';

  // Get gamemode restrictions
  const restrictions = getRestrictionsForGamemode(selectedGamemode as Gamemode);
  const forceToggles = restrictions?.forceToggles;

  // Helper function to check if a toggle is disabled by gamemode
  const isToggleDisabled = (toggleName: keyof NonNullable<typeof forceToggles>) => {
    return forceToggles && forceToggles[toggleName] !== undefined;
  };

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
      forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
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
      forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
    }
  };

  const handleLegacyBetaToggle = (checked: boolean) => {
    if (CONFIG.showLegacyBetaToggle) {
      setEnableLegacyBeta(checked);
      Cookies.set('enableLegacyBeta', checked.toString(), { expires: 365 });
      forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
    }
  };

  const handleArcToggle = (checked: boolean) => {
    if (CONFIG.showArcToggle) {
      setEnableArc(checked);
      Cookies.set('enableArc', checked.toString(), { expires: 365 });
      forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
    }
  };

  const handleArcBetaToggle = (checked: boolean) => {
    if (CONFIG.showArcBetaToggle) {
      setEnableArcBeta(checked);
      Cookies.set('enableArcBeta', checked.toString(), { expires: 365 });
      forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
    }
  };

  const handleProxyToggle = (checked: boolean) => {
    if (CONFIG.showProxyToggle) {
      setEnableProxy(checked);
      Cookies.set('enableProxy', checked.toString(), { expires: 365 });
      forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
    }
  };

  const handleNexusToggle = (checked: boolean) => {
    setEnableNexus(checked);
    Cookies.set('enableNexus', checked.toString(), { expires: 365 });
    forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
  };

  const handleNabooToggle = (checked: boolean) => {
    if (CONFIG.showNabooToggle) {
      setEnableNaboo(checked);
      Cookies.set('enableNaboo', checked.toString(), { expires: 365 });
      forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
    }
  };

  const handleFlushCache = async () => {
    await forceReloadContent(setIsLoading, setLoadingProgress, setLoadingMessage);
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
                        <SelectItem value="Campaign">Campaign</SelectItem>
                        <SelectItem value="Fighter Group">Fighter Group</SelectItem>
                        <SelectItem value="Battle for Naboo - Week 1">Battle for Naboo - Week 1</SelectItem>
                        <SelectItem value="Battle for Naboo - Week 2">Battle for Naboo - Week 2</SelectItem>
                        <SelectItem value="Battle for Naboo - Week 3">Battle for Naboo - Week 3</SelectItem>
                        <SelectItem value="Battle for Naboo - Week 4">Battle for Naboo - Week 4</SelectItem>
                        <SelectItem value="Battle for Naboo - Week 5">Battle for Naboo - Week 5</SelectItem>
                        <SelectItem value="Battle for Naboo - Week 6">Battle for Naboo - Week 6</SelectItem>
                        <SelectItem value="Unrestricted">Unrestricted</SelectItem>
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
                        <label htmlFor="legacy-toggle" className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isToggleDisabled('enableLegacy') ? 'opacity-50' : ''}`}>
                          Enable Legacy Content
                          {isToggleDisabled('enableLegacy') && <span className="text-xs text-muted-foreground ml-2">(Controlled by gamemode)</span>}
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('legacy'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="legacy-toggle"
                        checked={enableLegacy}
                        onCheckedChange={handleLegacyToggle}
                        disabled={isToggleDisabled('enableLegacy')}
                        className="custom-switch"
                      />
                    </div>
                  )}

                  {CONFIG.showNexusToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="nexus-toggle" className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isToggleDisabled('enableNexus') ? 'opacity-50' : ''}`}>
                          Enable Nexus Content
                          {isToggleDisabled('enableNexus') && <span className="text-xs text-muted-foreground ml-2">(Controlled by gamemode)</span>}
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('nexus'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="nexus-toggle"
                        checked={enableNexus}
                        onCheckedChange={handleNexusToggle}
                        disabled={isToggleDisabled('enableNexus')}
                        className="custom-switch"
                      />
                    </div>
                  )}
                </div>

                {/* Experimental Content Section */}
                <div className="mt-4">
                  <h5 className="font-semibold text-sm mb-3">Experimental Content</h5>
                  {CONFIG.showNabooToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="naboo-toggle" className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isToggleDisabled('enableNaboo') ? 'opacity-50' : ''}`}>
                          Enable Battle for Naboo Content
                          {isToggleDisabled('enableNaboo') && <span className="text-xs text-muted-foreground ml-2">(Controlled by gamemode)</span>}
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('naboo'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="naboo-toggle"
                        checked={enableNaboo}
                        onCheckedChange={handleNabooToggle}
                        disabled={isToggleDisabled('enableNaboo')}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showArcToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="arc-toggle" className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isToggleDisabled('enableArc') ? 'opacity-50' : ''}`}>
                          Enable Arc Content
                          {isToggleDisabled('enableArc') && <span className="text-xs text-muted-foreground ml-2">(Controlled by gamemode)</span>}
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('arc'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="arc-toggle"
                        checked={enableArc}
                        onCheckedChange={handleArcToggle}
                        disabled={isToggleDisabled('enableArc')}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showLegendsToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="legends-toggle" className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isToggleDisabled('enableLegends') ? 'opacity-50' : ''}`}>
                          Enable Legends Content
                          {isToggleDisabled('enableLegends') && <span className="text-xs text-muted-foreground ml-2">(Controlled by gamemode)</span>}
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('legends'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="legends-toggle"
                        checked={enableLegends}
                        onCheckedChange={handleLegendsToggle}
                        disabled={isToggleDisabled('enableLegends')}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showLegacyBetaToggle && isLegacyBetaWhitelisted && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="legacy-beta-toggle" className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isToggleDisabled('enableLegacyBeta') ? 'opacity-50' : ''}`}>
                          Enable Legacy Beta Content
                          {isToggleDisabled('enableLegacyBeta') && <span className="text-xs text-muted-foreground ml-2">(Controlled by gamemode)</span>}
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('legacy-beta'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="legacy-beta-toggle"
                        checked={enableLegacyBeta}
                        onCheckedChange={handleLegacyBetaToggle}
                        disabled={isToggleDisabled('enableLegacyBeta')}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showArcBetaToggle && isArcBetaWhitelisted && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="arc-beta-toggle" className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isToggleDisabled('enableArcBeta') ? 'opacity-50' : ''}`}>
                          Enable ARC Beta Content
                          {isToggleDisabled('enableArcBeta') && <span className="text-xs text-muted-foreground ml-2">(Controlled by gamemode)</span>}
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('arc-beta'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="arc-beta-toggle"
                        checked={enableArcBeta}
                        onCheckedChange={handleArcBetaToggle}
                        disabled={isToggleDisabled('enableArcBeta')}
                        className="custom-switch"
                      />
                    </div>
                  )}
                  {CONFIG.showProxyToggle && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="proxy-toggle" className={`text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${isToggleDisabled('enableProxy') ? 'opacity-50' : ''}`}>
                          Enable Card Proxies
                          {isToggleDisabled('enableProxy') && <span className="text-xs text-muted-foreground ml-2">(Controlled by gamemode)</span>}
                        </label>
                        <button type="button" onClick={() => { setInfoOpen('proxy'); }} className="ml-1 p-1 hover:bg-zinc-700/20 rounded-full" aria-label="Info">
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      <Switch
                        id="proxy-toggle"
                        checked={enableProxy}
                        onCheckedChange={handleProxyToggle}
                        disabled={isToggleDisabled('enableProxy')}
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
