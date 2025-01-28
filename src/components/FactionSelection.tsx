import { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import Cookies from 'js-cookie';
import { FactionIcon } from "@/components/FactionIcon";

const baseFactions = [
  { name: 'Rebel Alliance', logo: '/icons/rebel.svg', slug: 'rebel', shipImage: '/images/cr90.webp' },
  { name: 'Galactic Empire', logo: '/icons/empire.svg', slug: 'empire', shipImage: '/images/star-destroyer.webp' },
  { name: 'Galactic Republic', logo: '/icons/republic.svg', slug: 'republic', shipImage: '/images/venator.webp' },
  { name: 'Separatist Alliance', logo: '/icons/separatist.svg', slug: 'separatist', shipImage: '/images/lucrehulk.webp' },
];

const sandboxFaction = { name: 'Sandbox Mode', logo: '/icons/sandbox.webp', slug: 'sandbox', shipImage: '/images/sandbox.webp' };

const legendsFactions = [
  { name: 'Scum and Villainy', logo: '/icons/scum.svg', slug: 'scum', shipImage: '/images/action-vi-ship.webp' },
  { name: 'New Republic', logo: '/icons/new-republic.svg', slug: 'new-republic', shipImage: '/images/nebula.webp' },
];

const customFactions = [
  { name: 'United Nations Space Command', logo: '/icons/unsc.webp', slug: 'unsc', shipImage: '/images/unsc-marathon.webp' },
  { name: 'Covenant Empire', logo: '/icons/covenant.webp', slug: 'covenant', shipImage: '/images/covenant-ccs.webp' },
  { name: 'Colonial Fleet', logo: '/icons/colonial.webp', slug: 'colonial', shipImage: '/images/colonial-galactica.webp' },
  { name: 'Cylon Alliance', logo: '/icons/cylon.webp', slug: 'cylon', shipImage: '/images/cylon-basestar.webp' },
];

// const factionColors = {
//   rebel: '#D82B2B',
//   empire: '#197c27',
//   republic: '#880606',
//   separatist: '#161FDA',
//   unsc: '#2B579A',
//   covenant: '#800080',
//   colonial: '#B8860B',
//   cylon: '#CC0000',
//   sandbox: '#4A5568',
//   scum: '#FFD700',
//   'new-republic': '#b35605'
// };

// const shouldInvertImage = (logoPath: string) => {
//   if (logoPath === '/icons/sandbox.webp' || logoPath === '/icons/profile.svg' || logoPath === '/icons/new-republic.webp') {
//     return true;
//   }
//   return !logoPath.endsWith('.webp');
// };

export default function FactionSelection({ onHover }: { onHover: (faction: string | null) => void }) {
  const [enableLegends, setEnableLegends] = useState(false);
  const [enableCustomFactions, setEnableCustomFactions] = useState(false);

  useEffect(() => {
    const checkContentState = () => {
      const legendsEnabled = Cookies.get('enableLegends') === 'true';
      const customFactionsEnabled = Cookies.get('enableCustomFactions') === 'true';
      setEnableLegends(legendsEnabled);
      setEnableCustomFactions(customFactionsEnabled);
    };

    checkContentState();
    const intervalId = setInterval(checkContentState, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleHover = (faction: string | null) => {
    onHover(faction);
  };

  const availableFactions = enableLegends && enableCustomFactions
    ? {
        base: baseFactions,
        legends: legendsFactions,
        sandbox: [sandboxFaction],
        custom: customFactions
      }
    : enableLegends
      ? {
          base: baseFactions,
          legends: legendsFactions,
          sandbox: [sandboxFaction],
          custom: []
        }
      : enableCustomFactions
        ? {
            base: baseFactions,
            legends: [],
            sandbox: [sandboxFaction],
            custom: customFactions
          }
        : {
            base: baseFactions,
            legends: [],
            sandbox: [sandboxFaction],
            custom: []
          };

  return (
    <>
      <div className="mb-6 w-full">
        <div className="bg-blue-100/30 backdrop-blur-md border border-blue-400 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200 text-center font-medium">
            The AMG Update is out! All points are updated and your old fleets are being updated to the new points right now!
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-4 justify-items-center">
          {availableFactions.base.map((faction) => (
            <FactionIcon key={faction.slug} faction={faction} onHover={handleHover} />
          ))}
        </div>

        {enableLegends && availableFactions.legends.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 justify-items-center">
              {availableFactions.legends.map((faction) => (
                <FactionIcon key={faction.slug} faction={faction} onHover={handleHover} />
              ))}
            </div>
          </>
        )}

        <div className="flex justify-center">
          {availableFactions.sandbox.map((faction) => (
            <FactionIcon key={faction.slug} faction={faction} onHover={handleHover} />
          ))}
        </div>

        {enableCustomFactions && availableFactions.custom.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 justify-items-center">
              {availableFactions.custom.map((faction) => (
                <FactionIcon key={faction.slug} faction={faction} onHover={handleHover} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}