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
  const [tournamentMode, setTournamentMode] = useState(true);
  const maxFleetNameLength = 64;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return (
    
  <div className="min-h-screen text-gray-900 dark:text-white relative bg-transparent">
    <StarryBackground show={currentTheme === 'dark'} />
    {isLoading && <LoadingScreen progress={loadingProgress} message={loadingMessage} />}
    <div className="relative z-10 p-4 max-w-[2000px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {faction && (
              <Link href="/">
                <Image
                  src={factionLogos[faction as keyof typeof factionLogos]}
                  alt={`${faction} logo`}
                  width={32}
                  height={32}
                  className={`mr-2 ${currentTheme === 'dark' ? shouldInvertImage(factionLogos[faction as keyof typeof factionLogos]) ? 'invert' : '' : ''} cursor-pointer`}
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
              tournamentMode={tournamentMode}
              setTournamentMode={setTournamentMode}
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
          tournamentMode={tournamentMode}
          setTournamentMode={setTournamentMode}
            />
          )}
      </div>
    </div>
  );
}
