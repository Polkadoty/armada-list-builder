import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ListPlus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Cookies from 'js-cookie';
import { checkAndFetchData, flushCacheAndReload } from '../utils/dataFetcher';

export function ContentToggleButton() {
  const [enableLegacy, setEnableLegacy] = useState(false);
  const [enableLegends, setEnableLegends] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const legacyCookie = Cookies.get('enableLegacy');
    const legendsCookie = Cookies.get('enableLegends');
    setEnableLegacy(legacyCookie === 'true');
    setEnableLegends(legendsCookie === 'true');
  }, []);

  if (!mounted) {
    return null;
  }

  const isDarkTheme = theme === 'dark' || resolvedTheme === 'dark';

  const handleLegacyToggle = (checked: boolean) => {
    setEnableLegacy(checked);
    Cookies.set('enableLegacy', checked.toString(), { expires: 365 });
    flushCacheAndReload(() => {}, () => {}, () => {});
  };

  const handleLegendsToggle = (checked: boolean) => {
    setEnableLegends(checked);
    Cookies.set('enableLegends', checked.toString(), { expires: 365 });
    flushCacheAndReload(() => {}, () => {}, () => {});
  };

  return (
    <Tooltip>
      <Popover>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon">
              <ListPlus className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Content Settings</h4>
              <p className="text-sm text-muted-foreground">
                Toggle additional content for your fleet builder.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="legacy-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Enable Legacy content
                </label>
                <Switch
                  id="legacy-toggle"
                  checked={enableLegacy}
                  onCheckedChange={handleLegacyToggle}
                />
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="legends-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Enable Legends content
                </label>
                <Switch
                  id="legends-toggle"
                  checked={enableLegends}
                  onCheckedChange={handleLegendsToggle}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
        <TooltipContent>
          <p>Toggle Content</p>
        </TooltipContent>
      </Popover>
    </Tooltip>
  );
}
