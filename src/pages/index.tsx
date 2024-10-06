import { useState, useEffect } from 'react';
import Image from 'next/image';
import FactionSelection from '../components/FactionSelection';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from "@/components/ui/button";
import { SettingsButton } from '../components/SettingsButton';
import StarryBackground from '../components/StarryBackground';
import { useTheme } from 'next-themes';

export default function Home() {
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <StarryBackground show={theme === 'dark'} />
      <div className={`bg-white dark:bg-gray-900 p-8 flex-grow lg:w-1/3 lg:min-w-[300px] relative z-10`}>
        <div className="flex justify-end space-x-2 mb-4">
          <SettingsButton />
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Armada Fleet Builder</h1>
        <FactionSelection />
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
      {isWideScreen && (
        <div className="flex-grow relative lg:w-2/3">
          <Image 
            src="/images/space-battle.webp" 
            alt="Space Battle" 
            layout="fill" 
            objectFit="cover" 
          />
        </div>
      )}
    </div>
  );
}