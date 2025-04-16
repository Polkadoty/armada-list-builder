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
  { name: 'Scum and Villainy', logo: '/icons/scum.svg', slug: 'scum', shipImage: '/images/action-vi.webp' },
  { name: 'New Republic', logo: '/icons/new-republic.svg', slug: 'new-republic', shipImage: '/images/nebula.webp' },
];

const customFactions = [
  { name: 'United Nations Space Command', logo: '/icons/unsc.webp', slug: 'unsc', shipImage: '/images/unsc-marathon.webp' },
  { name: 'Covenant Empire', logo: '/icons/covenant.webp', slug: 'covenant', shipImage: '/images/covenant-ccs.webp' },
  { name: 'Colonial Fleet', logo: '/icons/colonial.webp', slug: 'colonial', shipImage: '/images/colonial-galactica.webp' },
  { name: 'Cylon Alliance', logo: '/icons/cylon.webp', slug: 'cylon', shipImage: '/images/cylon-basestar.webp' },
];

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
    // Only check once on component mount
    const legendsEnabled = Cookies.get('enableLegends') === 'true';
    const customFactionsEnabled = Cookies.get('enableCustomFactions') === 'true';
    setEnableLegends(legendsEnabled);
    setEnableCustomFactions(customFactionsEnabled);
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
        {/* <div className="bg-black/20 dark:bg-white/10 backdrop-blur-sm border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <p className="text-gray-800 dark:text-gray-200 text-center font-medium">
            If you are having issues logging into Facebook, send me a message on discord @polkadoty03 or to the github page in the faq so I can help you out!
          </p>
        </div> */}
      </div>
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-4 justify-items-center">
          {availableFactions.base.map((faction) => (
            <FactionIcon key={faction.slug} faction={faction} onHover={handleHover} />
          ))}
        </div>

        {enableLegends && availableFactions.legends.length > 0 && (
          <>
            <Separator className="bg-gray-600/30 dark:bg-gray-400/30 h-[2px]" />
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
            <Separator className="bg-gray-600/30 dark:bg-gray-400/30 h-[2px]" />
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