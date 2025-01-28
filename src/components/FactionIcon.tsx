import Image from 'next/image';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

interface FactionIconProps {
  faction: {
    name: string;
    logo: string;
    slug: string;
  };
  onHover?: (faction: string | null) => void;
}

export function FactionIcon({ faction, onHover }: FactionIconProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldInvertImage = (logoPath: string) => {
    if (logoPath === '/icons/sandbox.webp' || logoPath === '/icons/profile.svg') {
      return true;
    }
    return !logoPath.endsWith('.webp');
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <Link href={`/${faction.slug}`}>
          <div 
            className="p-4 transition-all duration-200 rounded-lg"
            onMouseEnter={() => onHover?.(faction.slug)}
            onMouseLeave={() => onHover?.(null)}
          >
            <Image 
              src={faction.logo} 
              alt={faction.name} 
              width={64} 
              height={64} 
              className={`transition-all duration-200 ${
                !mounted || currentTheme === 'dark' 
                  ? shouldInvertImage(faction.logo)
                    ? 'invert'
                    : ''
                  : ''
              }`}
            />
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent>{faction.name}</TooltipContent>
    </Tooltip>
  );
} 