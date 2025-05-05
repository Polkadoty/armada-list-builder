// src/components/SettingsButton.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FolderSync } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { flushCacheAndReload } from '../utils/dataFetcher';

interface SettingsButtonProps {
  setIsLoading: (isLoading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingMessage: (message: string) => void;
}

export function SettingsButton({ setIsLoading, setLoadingProgress, setLoadingMessage }: SettingsButtonProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDarkTheme = theme === 'dark' || resolvedTheme === 'dark';

  const handleFlushCache = async () => {
    await flushCacheAndReload(setIsLoading, setLoadingProgress, setLoadingMessage);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleFlushCache}>
          <FolderSync className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all ${isDarkTheme ? 'text-white' : 'text-zinc-900'}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Flush Cache and Reload</p>
      </TooltipContent>
    </Tooltip>
  );
}
