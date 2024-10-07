import { useState, useEffect } from 'react';
import Image from 'next/image';
import FactionSelection from '../components/FactionSelection';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from "@/components/ui/button";
import { SettingsButton } from '../components/SettingsButton';
import StarryBackground from '../components/StarryBackground';
import Link from 'next/link';

// a

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

    useEffect(() => {
        setMounted(true);
        const handleResize = () => setIsWideScreen(window.innerWidth >= 1024);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex flex-col relative items-center">
            <StarryBackground show={true} />

            <div className='flex w-full p-2 gap-4 items-center bg-white dark:bg-black z-10 border-b'>
                <Button variant="outline" size="sm" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20">SIGN IN</Button>
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

                <SettingsButton />
                <ThemeToggle />
            </div>

            <div className='flex-grow flex flex-col justify-center'>
                <FactionSelection onHover={setHoveredFaction} />
            </div>

            {/* {mounted && (
                <div className="flex-grow relative w-full">
                {Object.entries(factionShips).map(([faction, shipImage]) => (
                    <div
                    key={faction}
                    className={`absolute inset-0 transition-opacity duration-300 ${
                        hoveredFaction === faction ? 'opacity-75' : 'opacity-0'
                    }`}
                    >
                    <Image 
                        src={shipImage}
                        alt={`${faction} ship`}
                        layout="fill"
                        objectFit="contain"
                    />
                    </div>
                ))}
                </div>
            )} */}
        </div>
    );
}