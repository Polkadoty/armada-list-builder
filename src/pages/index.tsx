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
import { Import } from 'lucide-react';
import { useRouter } from 'next/router';
import { UserAvatar } from '../components/UserAvatar';
import { NotificationWindow } from "@/components/NotificationWindow";
import Head from 'next/head';

const factionShips = {
  rebel: '/images/cr90.webp',
  empire: '/images/star-destroyer.webp',
  republic: '/images/venator.webp',
  separatist: '/images/lucrehulk.webp',
  unsc: '/images/unsc-marathon.webp',
  covenant: '/images/covenant-ccs.webp',
  colonial: '/images/colonial-galactica.webp',
  cylon: '/images/cylon-basestar.webp'
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
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsWideScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    checkAndFetchData(setIsLoading, setLoadingProgress, setLoadingMessage);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImportFleet = (importText: string) => {
    // Load aliases first, before any processing
    const aliases = JSON.parse(localStorage.getItem("aliases") || "{}");

    const preprocessFleetText = (text: string): string => {
      // Remove <fleet> tags if present
      text = text.replace(/<\/?fleet>/g, "");

      // Check if this is DMBorque format
      const isDMBorqueFormat =
        (text.includes("+") && text.includes(":") && text.match(/\(\d+\s*\+\s*\d+\s*:\s*\d+\)/)) ||
        text.match(/^.+?\(\d+\/\d+\/\d+\)\n=+$/m);

      // Handle DMBorque fleet name format
      if (isDMBorqueFormat) {
        const lines = text.split("\n");
        const firstLine = lines[0];
        const nameMatch = firstLine.match(/^(.+?)\s*\(\d+\/\d+\/\d+\)/);
        if (nameMatch) {
          lines[0] = `Name: ${nameMatch[1]}`;
          // Remove the line of equals signs if it exists
          if (lines[1] && lines[1].match(/^=+$/)) {
            lines.splice(1, 1);
          }
          text = lines.join("\n");
        }
      }
      return text;
    };

    const processedText = preprocessFleetText(importText);
    const lines = processedText.split("\n");

    // Check faction first
    const factionLine = lines.find((line) => line.startsWith("Faction:"));
    let normalizedImportedFaction = '';

    if (factionLine) {
      const importedFaction = factionLine.split(":")[1].trim().toLowerCase();
      // Normalize faction names
      normalizedImportedFaction =
        importedFaction === "imperial" || importedFaction === "empire" || importedFaction === "galactic empire"
          ? "empire"
          : importedFaction === "rebel alliance"
          ? "rebel"
          : importedFaction === "galactic republic"
          ? "republic"
          : importedFaction === "separatist alliance"
          ? "separatist"
          : importedFaction;
    } else {
      // Try to determine faction from first ship or squadron
      const firstItemMatch = lines.find(line => {
        if (!line.trim() || line.startsWith('Total Points:') || line.startsWith('Squadrons:')) {
          return false;
        }
        
        const match = line.match(/^(?:•\s*)?(.+?)\s*\((\d+)\)/);
        if (match) {
          const [, itemName, itemPoints] = match;
          const itemKey = aliases[`${itemName} (${itemPoints})`];
          
          if (itemKey) {
            // Try to fetch as ship first
            const shipData = JSON.parse(localStorage.getItem("ships") || "{}");
            for (const chassisKey in shipData) {
              const models = shipData[chassisKey].models;
              if (models && models[itemKey]?.faction) {
                normalizedImportedFaction = models[itemKey].faction.toLowerCase();
                return true;
              }
            }
            
            // Try as squadron
            const squadronData = JSON.parse(localStorage.getItem("squadrons") || "{}");
            if (squadronData[itemKey]?.faction) {
              normalizedImportedFaction = squadronData[itemKey].faction.toLowerCase();
              return true;
            }
          }
        }
        return false;
      });

      if (!firstItemMatch) {
        setNotificationMessage("Could not determine faction from fleet list. Please include a 'Faction:' line in your fleet.");
        setShowNotification(true);
        return;
      }
    }

    // Save fleet and redirect
    localStorage.setItem(`savedFleet_${normalizedImportedFaction}`, importText);
    document.cookie = "retrieved-from-list=true; path=/";
    
    // Navigate to the correct faction
    router.push('/').then(() => {
      setTimeout(() => {
        router.push(`/${normalizedImportedFaction}`);
      }, 250);
    });
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
              className="invert-0 dark:invert"
              priority
            />
          </div>
          <FactionSelection onHover={setHoveredFaction} />
          <div className="mt-8 flex justify-center space-x-4">
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
        {showImportWindow && (
          <TextImportWindow
            onImport={handleImportFleet}
            onClose={() => setShowImportWindow(false)}
          />
        )}
        {showNotification && (
          <NotificationWindow
            message={notificationMessage}
            onClose={() => setShowNotification(false)}
          />
        )}
      </div>
    </>
  );
}
