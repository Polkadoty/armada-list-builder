import { useState, useEffect } from 'react';
import Image from 'next/image';
import FactionSelection from '../components/FactionSelection';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from "@/components/ui/button";
import StarryBackground from '../components/StarryBackground';
import Link from 'next/link';
import { LoadingScreen } from '../components/LoadingScreen';
import { checkAndFetchData } from '../utils/dataFetcher';
import { ContentToggleButton } from '../components/ContentToggleButton';
import { TextImportWindow } from '../components/TextImportWindow';
import { Import, Ship } from 'lucide-react';
import { useRouter } from 'next/router';
import { UserAvatar } from '../components/UserAvatar';
import Head from 'next/head';
import { WorkshopButton } from "@/components/WorkshopButton";

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
};

export default function Home() {
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [tournamentMode, setTournamentMode] = useState(true);
  const [showImportWindow, setShowImportWindow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    checkAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImportFleet = (importText: string) => {
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
      <div className="min-h-screen flex flex-col lg:flex-row relative">
        <StarryBackground show={true} lightDisabled={true}/>
        {isLoading && <LoadingScreen progress={loadingProgress} message={loadingMessage} />}
        <div className={`bg-white dark:bg-transparent p-8 flex-grow lg:w-1/3 lg:min-w-[300px] relative z-10`}>
          <div className="flex justify-end space-x-2 mb-4 items-center">
            <UserAvatar />
            <ContentToggleButton setIsLoading={setIsLoading} setLoadingProgress={setLoadingProgress} setLoadingMessage={setLoadingMessage} tournamentMode={tournamentMode} setTournamentMode={setTournamentMode} />
            <ThemeToggle />
          </div>
          <div className="flex flex-col items-center mb-8">
            <Image
              src="star-forge.svg"
              alt="Star Forge"
              width={300}
              height={100}
              className="invert-0 dark:invert h-auto"
              priority
            />
          </div>
          <FactionSelection onHover={setHoveredFaction} />
          <div className="mt-8 flex flex-col items-center space-y-4">
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 logo-font"
                onClick={() => setShowImportWindow(true)}
              >
                <Import className="mr-2 h-4 w-4" />
                IMPORT
              </Button>
              <Link href="/faq">
                <Button variant="outline" size="sm" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 logo-font">
                  FAQ
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 logo-font"
                onClick={() => window.open('https://ko-fi.com/polkadoty', '_blank')}
              >
                DONATE
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <WorkshopButton />
              <Link href="/shipyard">
                <Button variant="outline" className="flex items-center gap-2 logo-font">
                  <Ship className="h-4 w-4" />
                  Shipyard
                </Button>
              </Link>
            </div>

          </div>
        </div>
        {isWideScreen && mounted && (
          <div className="flex-grow relative lg:w-2/3">
            {Object.entries(factionShips).map(([faction, shipImage]) => (
              <div
                key={faction}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  hoveredFaction === faction ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image 
                  src={shipImage}
                  alt={`${faction} ship`}
                  layout="fill"
                  objectFit="contain"
                  className='p-24'
                  priority
                  loading="eager"
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
