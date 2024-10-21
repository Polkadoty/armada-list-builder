import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import FleetBuilder from '../../components/FleetBuilder';
import { ThemeToggle } from '../../components/ThemeToggle';
import Image from 'next/image';
import { SettingsButton } from '../../components/SettingsButton';
import StarryBackground from '../../components/StarryBackground';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '../../components/LoadingScreen';
import { ContentToggleButton } from '../../components/ContentToggleButton';
import { Input } from '../../components/ui/input';
import { Pencil } from 'lucide-react';

export const factionLogos = {
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
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [fleetName, setFleetName] = useState('Untitled Fleet');
    const [isEditingName, setIsEditingName] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentTheme = theme === 'system' ? systemTheme : theme;

    const handleNameClick = () => {
        setIsEditingName(true);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFleetName(e.target.value);
    };

    const handleNameBlur = () => {
        setIsEditingName(false);
    };

    return (
        <div className="min-h-screen text-gray-900 dark:text-white relative bg-transparent">
            <StarryBackground show={currentTheme === 'dark'} />
            {isLoading && <LoadingScreen progress={loadingProgress} message={loadingMessage} />}
            <div className="relative z-10">
                <div className="flex justify-between items-center p-4">
                    <div className="flex items-center space-x-2">
                        <ContentToggleButton />
                        <SettingsButton setIsLoading={setIsLoading} setLoadingProgress={setLoadingProgress} setLoadingMessage={setLoadingMessage} />
                        <ThemeToggle />
                    </div>
                </div>

                <FleetBuilder
                    faction={faction as string}
                    factionColor={factionColors[faction as keyof typeof factionColors]}
                    setFleetName={setFleetName}
                />
            </div>
        </div>
    );
}
