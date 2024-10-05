// src/components/SettingsButton.tsx
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { useTheme } from 'next-themes';

export function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clearCache = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('squadrons_') || key.startsWith('ships_')) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  };

  if (!mounted) {
    return null;
  }

  const isDarkTheme = theme === 'dark' || resolvedTheme === 'dark';

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <Settings className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all ${isDarkTheme ? 'text-white' : 'text-gray-900'}`} />
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <Button
              variant="ghost"
              className="block w-full text-left px-4 py-2 text-sm"
              onClick={clearCache}
            >
              Flush Cache and Reload
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}