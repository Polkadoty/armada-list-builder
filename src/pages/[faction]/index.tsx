import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import FleetBuilder from '../../components/FleetBuilder';
import { ThemeToggle } from '../../components/ThemeToggle';
import Image from 'next/image';
import { SettingsButton } from '../../components/SettingsButton';
import StarryBackground from '../../components/StarryBackground';
import { useEffect, useState } from 'react';

const factionLogos = {
  rebel: '/icons/rebel.svg',
  empire: '/icons/empire.svg',
  republic: '/icons/republic.svg',
  separatist: '/icons/separatist.svg',
};

const factionColors = {
  rebel: '#96001E',
  empire: '#046000',
  republic: '#880606',
  separatist: '#161FDA',
};

export default function FactionPage() {
  const router = useRouter();
  const { faction } = router.query;
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <div className="min-h-screen text-gray-900 dark:text-white relative bg-white dark:bg-transparent">
      <StarryBackground show={currentTheme === 'dark'} />
      <div className="relative z-10 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {faction && (
              <Image
                src={factionLogos[faction as keyof typeof factionLogos]}
                alt={`${faction} logo`}
                width={32}
                height={32}
                className={`mr-2 ${currentTheme === 'dark' ? 'invert' : ''}`}
              />
            )}
            <h1 className="text-2xl font-bold">Fleet Builder</h1>
          </div>
          <div className="flex items-center space-x-2">
            <SettingsButton />
            <ThemeToggle />
          </div>
        </div>
        <FleetBuilder faction={faction as string} factionColor={factionColors[faction as keyof typeof factionColors]} />
      </div>
    </div>
  );
}