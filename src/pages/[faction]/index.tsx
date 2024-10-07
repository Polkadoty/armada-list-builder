import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import FleetBuilder from '../../components/FleetBuilder';
import { ThemeToggle } from '../../components/ThemeToggle';
import Image from 'next/image';
import { SettingsButton } from '../../components/SettingsButton';
import StarryBackground from '../../components/StarryBackground';
import { useEffect, useState } from 'react';

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

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const currentTheme = theme === 'system' ? systemTheme : theme;

    return (
        <div className="min-h-screen flex flex-col relative items-center">
            <StarryBackground show={true} />

            <div className='flex w-full p-2 gap-4 items-center bg-white dark:bg-black z-10 border-b'>
                <SettingsButton />
                <ThemeToggle />
            </div>
        
            <div className="w-full text-gray-900 dark:text-white relative max-w-[1024px]">
                <FleetBuilder faction={faction as string} factionColor={factionColors[faction as keyof typeof factionColors]} />
            </div>
        </div>
    );
}