import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from 'next-themes';
import { Separator } from "@/components/ui/separator";
import Cookies from 'js-cookie';

const baseFactions = [
  { name: 'Rebel Alliance', logo: '/icons/rebel.svg', slug: 'rebel', shipImage: '/images/cr90.webp' },
  { name: 'Galactic Empire', logo: '/icons/empire.svg', slug: 'empire', shipImage: '/images/star-destroyer.webp' },
  { name: 'Galactic Republic', logo: '/icons/republic.svg', slug: 'republic', shipImage: '/images/venator.webp' },
  { name: 'Separatist Alliance', logo: '/icons/separatist.svg', slug: 'separatist', shipImage: '/images/lucrehulk.webp' },
];

const legendsFactions = [
  { name: 'United Nations Space Command', logo: '/icons/unsc.webp', slug: 'unsc', shipImage: '/images/unsc-marathon.webp' },
  { name: 'Covenant Empire', logo: '/icons/covenant.webp', slug: 'covenant', shipImage: '/images/covenant-ccs.webp' },
  { name: 'Colonial Fleet', logo: '/icons/colonial.webp', slug: 'colonial', shipImage: '/images/colonial-galactica.webp' },
  { name: 'Cylon Alliance', logo: '/icons/cylon.webp', slug: 'cylon', shipImage: '/images/cylon-basestar.webp' },
];

const factionColors = {
  rebel: '#D82B2B',
  empire: '#197c27',
  republic: '#880606',
  separatist: '#161FDA',
  unsc: '#2B579A',
  covenant: '#800080',
  colonial: '#B8860B',
  cylon: '#CC0000',
};

const shouldInvertImage = (logoPath: string) => {
  return !logoPath.endsWith('.webp');
};

export default function FactionSelection({ onHover }: { onHover: (faction: string | null) => void }) {
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [enableLegends, setEnableLegends] = useState(false);
  const [enableCustomFactions, setEnableCustomFactions] = useState(false);
  const [showLegendsContent, setShowLegendsContent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkContentState = () => {
      const legendsEnabled = Cookies.get('enableLegends') === 'true';
      const customFactionsEnabled = Cookies.get('enableCustomFactions') === 'true';
      setEnableLegends(legendsEnabled);
      setEnableCustomFactions(customFactionsEnabled);
      
      if (legendsEnabled && customFactionsEnabled) {
        setTimeout(() => setShowLegendsContent(true), 50);
      } else {
        setShowLegendsContent(false);
      }
    };

    checkContentState();
    const intervalId = setInterval(checkContentState, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const handleHover = (faction: string | null) => {
    setHoveredFaction(faction);
    onHover(faction);
  };

  const availableFactions = [
    ...baseFactions,
    ...(enableLegends && enableCustomFactions ? legendsFactions : [])
  ];

  return (
    <div className="grid grid-cols-2 gap-4 justify-items-center">
      {availableFactions.map((faction, index) => (
        <>
          {enableLegends && index === baseFactions.length && (
            <>
              <div className={`col-span-2 w-full px-4 my-2 transition-opacity duration-500 ${showLegendsContent ? 'opacity-100' : 'opacity-0'}`}>
                <Separator className="my-4" />
              </div>
              <div className={`col-span-2 w-full px-4 mb-4 transition-opacity duration-500 ${showLegendsContent ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-yellow-100/30 backdrop-blur-md border border-yellow-400 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-center font-medium">
                    ⚠️ This content is WIP and is subject to frequent changes.
                  </p>
                </div>
              </div>
            </>
          )}
          <Tooltip key={faction.slug}>
            <TooltipTrigger>
              <Link href={`/${faction.slug}`}>
                <div 
                  className={`p-4 transition-all duration-500 rounded-lg ${
                    enableLegends && index >= baseFactions.length 
                      ? `transition-all duration-500 ${showLegendsContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`
                      : ''
                  }`}
                  style={{
                    transitionDelay: enableLegends && index >= baseFactions.length ? `${(index - baseFactions.length) * 100 + 100}ms` : '0ms'
                  }}
                  onMouseEnter={() => handleHover(faction.slug)}
                  onMouseLeave={() => handleHover(null)}
                >
                  <Image 
                    src={faction.logo} 
                    alt={faction.name} 
                    width={64} 
                    height={64} 
                    className={`transition-all duration-200 ${!mounted || currentTheme === 'dark' ? shouldInvertImage(faction.logo) ? 'invert' : '' : ''}`}
                    style={{
                      filter: hoveredFaction === faction.slug 
                        ? `drop-shadow(0 0 1.5rem ${factionColors[faction.slug as keyof typeof factionColors]}) ${!mounted || currentTheme === 'dark' ? shouldInvertImage(faction.logo) ? 'invert(1) hue-rotate(180deg)' : '' : ''}`
                        : !mounted || currentTheme === 'dark' ? shouldInvertImage(faction.logo) ? 'invert(1)' : 'none' : 'none',
                    }}
                  />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>{faction.name}</TooltipContent>
          </Tooltip>
        </>
      ))}
    </div>
  );
}