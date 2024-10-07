import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from 'next-themes';

const factions = [
  { name: 'Rebel Alliance', logo: '/icons/rebel.svg', slug: 'rebel', shipImage: '/images/cr90.webp' },
  { name: 'Galactic Empire', logo: '/icons/empire.svg', slug: 'empire', shipImage: '/images/star-destroyer.webp' },
  { name: 'Galactic Republic', logo: '/icons/republic.svg', slug: 'republic', shipImage: '/images/venator.webp' },
  { name: 'Separatist Alliance', logo: '/icons/separatist.svg', slug: 'separatist', shipImage: '/images/lucrehulk.webp' },
];

const factionColors = {
  rebel: '#D82B2B',
  empire: '#197c27',
  republic: '#880606',
  separatist: '#161FDA',
};

export default function FactionSelection({ onHover }: { onHover: (faction: string | null) => void }) {
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const handleHover = (faction: string | null) => {
    setHoveredFaction(faction);
    onHover(faction);
  };

  return (
    <div className="gap-12 p-4 grid grid-cols-2">
      {factions.map((faction) => (
        <Tooltip key={faction.slug}>
          <TooltipTrigger>
            <Link href={`/${faction.slug}`}>
              <div 
                className="transition-colors duration-200 rounded-lg"
                onMouseEnter={() => handleHover(faction.slug)}
                onMouseLeave={() => handleHover(null)}
              >
              <Image 
                src={faction.logo} 
                alt={faction.name} 
                width={72} 
                height={72} 
                className={`transition-all duration-300 ${!mounted || currentTheme === 'dark' ? 'invert' : ''} hover:scale-[1.04]`}
                // style={{
                //   filter: hoveredFaction === faction.slug 
                //     ? `drop-shadow(0 0 0.75rem ${factionColors[faction.slug as keyof typeof factionColors]}) ${!mounted || currentTheme === 'dark' ? 'invert(1) hue-rotate(180deg)' : ''}`
                //     : !mounted || currentTheme === 'dark' ? 'invert(1)' : 'none',
                // }}
              />
              </div>
            </Link>
          </TooltipTrigger>
          {/* <TooltipContent>{faction.name}</TooltipContent> */}
        </Tooltip>
      ))}
    </div>
  );
}