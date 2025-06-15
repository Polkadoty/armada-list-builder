import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import FleetBuilder from '../../components/FleetBuilder';
import { ThemeToggle } from '../../components/ThemeToggle';
import Image from 'next/image';
import StarryBackground from '../../components/StarryBackground';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ContentToggleButton } from '../../components/ContentToggleButton';
import { Input } from '../../components/ui/input';
import { Pencil } from 'lucide-react';
import { UserAvatar } from '../../components/UserAvatar';
import Link from 'next/link';
import Head from 'next/head';
import { checkAndFetchData } from '../../utils/dataFetcher';

const shouldInvertImage = (logoPath: string) => {
  return !logoPath.endsWith('.webp');
};

export const factionLogos = {
  rebel: '/icons/rebel.svg',
  empire: '/icons/empire.svg',
  republic: '/icons/republic.svg',
  separatist: '/icons/separatist.svg',
  unsc: '/icons/unsc.webp',
  covenant: '/icons/covenant.webp',
  colonial: '/icons/colonial.webp',
  cylon: '/icons/cylon.webp',
  sandbox: '/icons/sandbox.webp',
  scum: '/icons/scum.webp',
  'new-republic': '/icons/new-republic.svg',
};

const factionColors = {
  rebel: '#96001E',
  empire: '#046000',
  republic: '#880606',
  separatist: '#161FDA',
  unsc: '#2B579A',
  covenant: '#800080',
  colonial: '#B8860B',
  cylon: '#CC0000',
  sandbox: '#000000',
  scum: '#FFF8E1',
  'new-republic': '#b35605'
};

export default function FactionPage() {
  const router = useRouter();
  const { faction } = router.query;
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [fleetName, setFleetName] = useState('Untitled Fleet');
  const [isEditingName, setIsEditingName] = useState(false);
  const [gamemode, setGamemode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedGamemode');
      return stored ? stored : 'Standard';
    }
    return 'Standard';
  });
  const maxFleetNameLength = 64;

  useEffect(() => {
    setMounted(true);
    checkAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage);
  }, []);

  // Auto-switch gamemode based on faction
  useEffect(() => {
    if (faction && mounted) {
      console.log('Faction changed to:', faction);
      
      if (faction === 'sandbox') {
        // Sandbox faction should always use Unrestricted gamemode
        console.log('Sandbox detected, switching to Unrestricted');
        setGamemode('Unrestricted');
      }
      // For non-sandbox factions, we'll handle the switch in a separate effect
    }
  }, [faction, mounted]);

  // Handle switching away from Unrestricted when leaving sandbox
  useEffect(() => {
    if (faction && mounted && faction !== 'sandbox' && gamemode === 'Unrestricted') {
      console.log('Non-sandbox faction with Unrestricted mode, switching to Standard');
      setGamemode('Standard');
    }
  }, [faction, mounted, gamemode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedGamemode', gamemode || 'Standard');
    }
  }, [gamemode]);

  if (!mounted || !faction) return null;

  const currentTheme = theme === 'system' ? systemTheme : theme;

  const handleNameClick = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value.slice(0, maxFleetNameLength);
    setFleetName(newName);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Clear any existing fleet data
    // localStorage.removeItem(`savedFleet_${faction}`);
    
    // Navigate to home page
    router.push('/');
  };

  return (
    <div className="relative min-h-screen w-full text-gray-900 dark:text-white overflow-hidden bg-transparent">
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg?v=2" color="#000000" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="manifest" href="/site.webmanifest?v=2" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml?v=2" />
        <meta name="theme-color" content="#000000" />
        <title>Star Forge</title>
      </Head>
      <StarryBackground show={currentTheme === 'dark'} />
      {isLoading && <LoadingScreen progress={loadingProgress} message={loadingMessage} />}
      <div className="relative z-10 p-4 max-w-[2000px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {faction && (
              <Link href="/" onClick={handleLogoClick}>
                <Image
                  src={factionLogos[faction as keyof typeof factionLogos]}
                  alt={`${faction} logo`}
                  width={32}
                  height={32}
                  className={`mr-2 ${currentTheme === 'dark' ? (faction === 'sandbox' ? 'invert' : shouldInvertImage(factionLogos[faction as keyof typeof factionLogos]) ? 'invert' : '') : ''} cursor-pointer`}
                />
              </Link>
            )}
            <h1 className="text-2xl font-bold mr-4 logo-font"></h1>
            {isEditingName ? (
              <Input
                value={fleetName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                className="text-xl font-bold"
                autoFocus
                maxLength={maxFleetNameLength}
              />
            ) : (
              <div className="flex items-center cursor-pointer" onClick={handleNameClick}>
                <h2 className="text-xl font-bold mr-2">
                  {fleetName}
                </h2>
                <Pencil className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <UserAvatar />
            <ContentToggleButton
              setIsLoading={setIsLoading}
              setLoadingProgress={setLoadingProgress}
              setLoadingMessage={setLoadingMessage}
              gamemode={gamemode}
              setGamemode={setGamemode}
            />
            <ThemeToggle />
          </div>
        </div>
        {mounted && faction && (
        <FleetBuilder
          key={faction as string} // Add this line to force remount
          faction={faction as string}
          factionColor={factionColors[faction as keyof typeof factionColors]}
          fleetName={fleetName}
          setFleetName={setFleetName}
          gamemode={gamemode}
        />
          )}
      </div>
    </div>
  );
}