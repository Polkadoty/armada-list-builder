import { useState, useEffect } from 'react';
import Image from 'next/image';
import FactionSelection from '../components/FactionSelection';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from "@/components/ui/button";
import { SettingsButton } from '../components/SettingsButton';
import StarryBackground from '../components/StarryBackground';
import { useTheme } from 'next-themes';

const factionShips = {
  rebel: '/images/cr90.webp',
  empire: '/images/star-destroyer.webp',
  republic: '/images/venator.webp',
  separatist: '/images/lucrehulk.webp',
};

export default function Home() {
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <StarryBackground show={true} />
      <div className={`bg-white dark:bg-transparent p-8 flex-grow lg:w-1/3 lg:min-w-[300px] relative z-10`}>
        <div className="flex justify-end space-x-2 mb-4">
          <SettingsButton />
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Armada Fleet Builder</h1>
        <FactionSelection onHover={setHoveredFaction} />
        <div className="mt-8 flex justify-center space-x-4">
          <Button variant="outline" size="sm" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20">SIGN IN</Button>
          <Button variant="outline" size="sm" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20">FAQ</Button>
          <Button
            variant="outline"
            size="sm"
            className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
            onClick={() => window.open('https://ko-fi.com/polkadoty', '_blank')}
          >
            DONATE
          </Button>
        </div>
      </div>
      {isWideScreen && mounted && (
        <div className="flex-grow relative lg:w-2/3">
          {Object.entries(factionShips).map(([faction, shipImage]) => (
            <div
              key={faction}
              className={`absolute inset-0 transition-opacity duration-300 ${
                hoveredFaction === faction ? 'opacity-50' : 'opacity-0'
              }`}
            >
              <Image 
                src={shipImage}
                alt={`${faction} ship`}
                layout="fill"
                objectFit="contain"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}