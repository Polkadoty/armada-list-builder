import { useState, useEffect } from 'react';
import Image from 'next/image';
import FactionSelection from '../components/FactionSelection';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from "@/components/ui/button";
import StarryBackground from '../components/StarryBackground';
import Link from 'next/link';
import { LoadingScreen } from '../components/LoadingScreen';
import { smartCheckAndFetchData } from '../utils/contentManager';
import { ContentToggleButton } from '../components/ContentToggleButton';
import { TextImportWindow } from '../components/TextImportWindow';
import { Import } from 'lucide-react';
import { useRouter } from 'next/router';
import { UserAvatar } from '../components/UserAvatar';
import Head from 'next/head';
import { useTheme } from 'next-themes';
import Cookies from 'js-cookie';

const factionShips = {
  rebel: '/images/cr90.webp',
  empire: '/images/star-destroyer.webp',
  republic: '/images/venator.webp',
  separatist: '/images/lucrehulk.webp',
  unsc: '/images/unsc-marathon.webp',
  covenant: '/images/covenant-ccs.webp',
  colonial: '/images/colonial-galactica.webp',
  cylon: '/images/cylon-basestar.webp',
  sandbox: '/images/dreadnaught.webp',
  scum: '/images/action-vi.webp',
  'new-republic': '/images/nebula.webp',
  'first-order': '/images/resurgent.webp',
  'resistance': '/images/mc85.webp',
};

export default function Home() {
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [gamemode, setGamemode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedGamemode');
      return stored ? stored : 'Standard';
    }
    return 'Standard';
  });
  const [showImportWindow, setShowImportWindow] = useState(false);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [enableLegends, setEnableLegends] = useState(false);
  const [enableNexus, setEnableNexus] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    smartCheckAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedGamemode', gamemode || 'Standard');
      // Initialize enableLegends from cookie
      const legendsCookie = Cookies.get('enableLegends');
      setEnableLegends(legendsCookie === 'true');
      // Initialize enableNexus from cookie
      const nexusCookie = Cookies.get('enableNexus');
      setEnableNexus(nexusCookie === 'true');
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [gamemode]);

  // Poll for enableLegends cookie changes and update state
  useEffect(() => {
    let prevLegends = Cookies.get('enableLegends');
    const interval = setInterval(() => {
      const currentLegends = Cookies.get('enableLegends');
      if (currentLegends !== prevLegends) {
        setEnableLegends(currentLegends === 'true');
        prevLegends = currentLegends;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll for enableNexus cookie changes and update state
  useEffect(() => {
    let prevNexus = Cookies.get('enableNexus');
    const interval = setInterval(() => {
      const currentNexus = Cookies.get('enableNexus');
      if (currentNexus !== prevNexus) {
        setEnableNexus(currentNexus === 'true');
        prevNexus = currentNexus;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleImportFleet = (importText: string) => {
    // Check for gamemode in the import text and set it
    const gamemodeMatch = importText.match(/Gamemode:\s*(.+)/);
    if (gamemodeMatch) {
      const newGamemode = gamemodeMatch[1].trim();
      console.log("Found gamemode in import:", newGamemode);
      localStorage.setItem('selectedGamemode', newGamemode);
    }
    
    // Save the import text temporarily
    localStorage.setItem('pendingImport', importText);
    // Redirect to sandbox faction
    router.push('/sandbox');
  };

  if (!mounted) return null;

  return (
    <>
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
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="srgb p3" />
        <title>Star Forge</title>
      </Head>
      <div className="relative min-h-screen w-full flex flex-col lg:flex-row overflow-hidden">
        <StarryBackground show={true} lightDisabled={resolvedTheme === 'dark'}/>
        {isLoading && <LoadingScreen progress={loadingProgress} message={loadingMessage} />}
        <div className={`bg-transparent lg:backdrop-blur-sm md:backdrop-blur-[2px] backdrop-blur-[1px] p-8 flex-grow lg:w-1/3 lg:min-w-[300px] relative z-10`}>
          <div className="flex justify-end space-x-2 mb-4 items-center">
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
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/Star Forge Logo.png"
              alt="Star Forge Logo"
              width={300}
              height={100}
              className="invert dark:invert-0 h-auto"
              priority
            />
          </div>
          
          {/* Battle for Naboo Campaign Information */}
          <div className="mb-6 p-4 bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg backdrop-blur-md">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                                                             Join the <b>Battle for Naboo</b> event by making your fleet using the &quot;Battle for Naboo&quot; gamemode. Select it in the top right corner in the &quot;plus&quot; menu, and check out the status menu here:{' '}
              <a 
                href="https://www.armada.community/events/battle-for-naboo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-300 font-medium"
              >
                https://www.armada.community/events/battle-for-naboo
              </a>
            </p>
          </div>
          
          <FactionSelection onHover={setHoveredFaction} enableLegends={enableLegends} enableNexus={enableNexus} />
          <div className="mt-8 flex flex-col items-center space-y-4">
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md logo-font"
                onClick={() => setShowImportWindow(true)}
              >
                <Import className="mr-2 h-4 w-4" />
                IMPORT
              </Button>
              <Link href="/faq">
                <Button variant="outline" size="sm" className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md logo-font">
                  FAQ
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md logo-font"
                onClick={() => window.open('https://ko-fi.com/polkadoty', '_blank')}
              >
                DONATE
              </Button>
            </div>
            {/* Workshop and Shipyard buttons hidden
            <div className="flex items-center gap-2">
              <WorkshopButton />
              <Button 
                variant="outline" 
                size="sm" 
                disabled
                className="bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 backdrop-blur-md flex items-center gap-2 logo-font cursor-not-allowed opacity-60"
              >
                <Ship className="h-4 w-4" />
                Shipyard - Coming Soon
              </Button>
            </div>
            */}

          </div>
        </div>
        {isWideScreen && mounted && (
          <div className="flex-grow relative lg:w-2/3">
            {Object.entries(factionShips).map(([faction, shipImage]) => (
              <div
                key={faction}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  hoveredFaction === faction ? 'opacity-100' : 'opacity-0'
                } will-change-opacity`}
                style={{ contain: 'strict' }}
              >
                <Image 
                  src={shipImage}
                  alt={`${faction} ship`}
                  layout="fill"
                  objectFit="contain"
                  className='p-24'
                  priority={faction === 'rebel'} // Only prioritize the first ship
                  loading={faction === 'rebel' ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        )}
        {showImportWindow && (
          <TextImportWindow
            onImport={handleImportFleet}
            onClose={() => setShowImportWindow(false)}
          />
        )}
      </div>
    </>
  );
}