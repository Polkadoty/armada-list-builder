import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import FleetBuilder from '../../components/FleetBuilder';
import { ThemeToggle } from '../../components/ThemeToggle';
import Image from 'next/image';

const factionLogos = {
  rebel: '/icons/rebel.svg',
  empire: '/icons/empire.svg',
  republic: '/icons/republic.svg',
  separatist: '/icons/separatist.svg',
};

export default function FactionPage() {
  const router = useRouter();
  const { faction } = router.query;
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 dark:bg-nebula bg-cover text-gray-900 dark:text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {faction && (
            <Image
              src={factionLogos[faction as keyof typeof factionLogos]}
              alt={`${faction} logo`}
              width={32}
              height={32}
              className={`mr-2 ${theme === 'dark' ? 'filter invert' : ''}`}
            />
          )}
          <h1 className="text-2xl font-bold">Fleet Builder</h1>
        </div>
        <ThemeToggle />
      </div>
      <FleetBuilder />
    </div>
  );
}