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

const factionColors = {
  rebel: '#D82B2B',
  empire: '#197c27',
  republic: '#880606',
  separatist: '#161FDA',
  unsc: '#2B579A',
  covenant: '#800080',
  colonial: '#B8860B',
  cylon: '#CC0000',
  sandbox: '#4A5568',
  scum: '#FFD700',
  'new-republic': '#27E6FF',
  'first-order': '#FF0000',
  'resistance': '#FF8C00'
};

const customFactionIcons = [
  '/icons/unsc.webp',
  '/icons/covenant.webp',
  '/icons/colonial.webp',
  '/icons/cylon.webp'
];

export function FactionIcon({ faction, onHover }: FactionIconProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldInvertImage = (logoPath: string) => {
    // Special cases that should always be inverted in dark mode
    if (logoPath === '/icons/sandbox.webp' || logoPath === '/icons/profile.svg') {
      return true;
    }
    
    // Custom faction webp icons that should be inverted in light mode
    const customFactionIcons = [
      '/icons/unsc.webp',
      '/icons/covenant.webp',
      '/icons/colonial.webp',
      '/icons/cylon.webp'
    ];
    
    if (customFactionIcons.includes(logoPath)) {
      return currentTheme === 'light';
    }
    
    // Default behavior for other icons
    return !logoPath.endsWith('.webp');
  };

  const glowColor = factionColors[faction.slug as keyof typeof factionColors] || '#4A5568';

  return (
    <Tooltip>
      <TooltipTrigger>
        <Link href={`/${faction.slug}`}>
          <div 
            className="p-4 transition-all duration-200 rounded-lg hover:scale-110 backdrop-blur-sm"
            onMouseEnter={() => onHover?.(faction.slug)}
            onMouseLeave={() => onHover?.(null)}
            style={{
              '--glow-color': glowColor,
            } as React.CSSProperties}
          >
            <Image 
              src={faction.logo} 
              alt={faction.name} 
              width={faction.slug === 'resistance' ? 77 : 64} 
              height={faction.slug === 'resistance' ? 77 : 64} 
              className={`transition-all duration-200 hover:drop-shadow-[0_0_8px_var(--glow-color)] ${
                !mounted ? '' : 
                customFactionIcons.includes(faction.logo)
                  ? currentTheme === 'light' 
                    ? 'invert'
                    : ''
                  : currentTheme === 'dark' && shouldInvertImage(faction.logo)
                    ? 'invert'
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