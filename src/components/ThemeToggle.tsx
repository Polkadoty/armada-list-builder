import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="relative w-10 h-10 bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute text-gray-900 dark:text-white" />
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute text-gray-900 dark:text-white" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}