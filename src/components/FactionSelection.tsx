import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from 'next-themes';

const factions = [
  { name: 'Rebel Alliance', logo: '/icons/rebel.svg', slug: 'rebel' },
  { name: 'Galactic Empire', logo: '/icons/empire.svg', slug: 'empire' },
  { name: 'Galactic Republic', logo: '/icons/republic.svg', slug: 'republic' },
  { name: 'Separatist Alliance', logo: '/icons/separatist.svg', slug: 'separatist' },
];

const factionColors = {
  rebel: '#D82B2B',
  empire: '#197c27',
  republic: '#880606',
  separatist: '#161FDA',
};

export default function FactionSelection() {
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-4 justify-items-center">
      {factions.map((faction) => (
        <Tooltip key={faction.slug}>
          <TooltipTrigger>
            <Link href={`/${faction.slug}`}>
              <div 
                className="p-4 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors duration-200 rounded-lg"
                onMouseEnter={() => setHoveredFaction(faction.slug)}
                onMouseLeave={() => setHoveredFaction(null)}
              >
              <Image 
                src={faction.logo} 
                alt={faction.name} 
                width={64} 
                height={64} 
                className={`transition-all duration-200 ${theme === 'dark' ? 'invert' : ''}`}
                style={{
                  filter: hoveredFaction === faction.slug 
                    ? `drop-shadow(0 0 0.75rem ${factionColors[faction.slug as keyof typeof factionColors]}) ${theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : ''}`
                    : theme === 'dark' ? 'invert(1)' : 'none',
                }}
              />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent>{faction.name}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}