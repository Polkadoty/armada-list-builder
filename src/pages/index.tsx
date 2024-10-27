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
import { LoginButton } from '../components/LoginButton';
import { UserAvatar } from '../components/UserAvatar';

const factionShips = {
  rebel: '/images/cr90.webp',
  empire: '/images/star-destroyer.webp',
  republic: '/images/venator.webp',
  separatist: '/images/lucrehulk.webp',
};

export default function Home() {
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredFaction, setHoveredFaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [tournamentMode, setTournamentMode] = useState(true);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    checkAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <StarryBackground show={true} lightDisabled={true}/>
      {isLoading && <LoadingScreen progress={loadingProgress} message={loadingMessage} />}
      <div className={`bg-white dark:bg-transparent p-8 flex-grow lg:w-1/3 lg:min-w-[300px] relative z-10`}>
        <div className="flex justify-end space-x-2 mb-4 items-center">
          <UserAvatar />
          <ContentToggleButton setIsLoading={setIsLoading} setLoadingProgress={setLoadingProgress} setLoadingMessage={setLoadingMessage} tournamentMode={tournamentMode} setTournamentMode={setTournamentMode} />
          <ThemeToggle />
        </div>
        <div className="flex justify-center mb-8">
          <Image
            src="legacy-logo.svg"
            alt="Armada Legacy Fleet Builder"
            width={300}
            height={100}
            className="dark:invert"
            priority
          />
        </div>
        <FactionSelection onHover={setHoveredFaction} />
        <div className="mt-8 flex justify-center space-x-4">
          <LoginButton />
          <Link href="/faq">
            <Button variant="outline" size="sm" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20">FAQ</Button>
          </Link>
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
                hoveredFaction === faction ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image 
                src={shipImage}
                alt={`${faction} ship`}
                layout="fill"
                objectFit="contain"
                className='p-24'
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
