import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpring, animated } from 'react-spring';
import UpgradeIconsToolbar from './UpgradeIconsToolbar';
import { Ship, Upgrade } from "./FleetBuilder";
import { Copy, Trash2, ArrowLeftRight, X, ChevronDown, ChevronUp } from 'lucide-react';

interface SelectedShipProps {
    ship: Ship;
    onRemove: (id: string) => void;
    onUpgradeClick: (shipId: string, upgrade: string, index: number) => void;
    onCopy: (ship: Ship) => void;
    handleRemoveUpgrade: (shipId: string, upgradeType: string, index: number) => void;
    disabledUpgrades: string[];
    enabledUpgrades: string[];
    filledSlots: Record<string, number[]>;
    hasCommander: boolean;
    traits: string[];
}

export function SelectedShip({ ship, onRemove, onUpgradeClick, onCopy, handleRemoveUpgrade, disabledUpgrades, enabledUpgrades, filledSlots, hasCommander }: SelectedShipProps) {
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);
    const [{ x }, api] = useSpring(() => ({ x: 0 }));

    const isDragging = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const isHorizontalSwipe = useRef(false);

    const SWIPE_THRESHOLD = 100;
    const ANGLE_THRESHOLD = 30; // Degrees

    const handleShipTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isHorizontalSwipe.current = false;
    };

    const handleShipTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - startX.current;
        const deltaY = currentY - startY.current;

        if (!isHorizontalSwipe.current) {
            const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
            isHorizontalSwipe.current = angle < ANGLE_THRESHOLD || angle > (180 - ANGLE_THRESHOLD);
        }

        if (isHorizontalSwipe.current) {
            e.preventDefault();
            api.start({ x: deltaX, immediate: true });
        }
    };

    const handleShipTouchEnd = () => {
        isDragging.current = false;
        if (isHorizontalSwipe.current) {
            const currentX = x.get();
            if (currentX < -SWIPE_THRESHOLD) {
                onRemove(ship.id);
            } else if (currentX > SWIPE_THRESHOLD) {
                onCopy(ship);
            }
        }
        api.start({ x: 0, immediate: false });
        isHorizontalSwipe.current = false;
    };

    const toggleToolbar = () => {
        setIsToolbarVisible(!isToolbarVisible);
    };

    const totalShipPoints = ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0);

    const handleUpgradeRemove = (upgradeType: string, upgradeIndex: number) => {
        handleRemoveUpgrade(ship.id, upgradeType, upgradeIndex);
    };

    return (
        <div className="relative overflow-hidden mb-2 rounded-xl h-full">
            <animated.div style={{ x }} className='h-full'>
                <div className="relative h-full flex flex-col">
                    <div
                        onTouchStart={handleShipTouchStart}
                        onTouchMove={handleShipTouchMove}
                        onTouchEnd={handleShipTouchEnd}
                    >
                        <div className="flex flex-col">
                            <div className="w-full aspect-[8/3] relative overflow-hidden">
                                <Image
                                    src={ship.cardimage}
                                    alt={ship.name}
                                    layout="fill"
                                    objectFit="cover"
                                    objectPosition="top right"
                                    className="scale-[100%]"
                                />
                            </div>

                            <div className="flex-grow p-2 w-full border-l border-r border-t">
                                <div className="font-bold text-xl items-center truncate max-w-full">
                                    {ship.unique && <span className="mr-1">●</span>}
                                    {ship.name}
                                </div>

                                <div className="flex items-center w-full">
                                    <span className='mr-auto'>{totalShipPoints} Points</span>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onCopy(ship)}
                                        className={`p-1 ${ship.unique ? 'hidden' : ''}`}
                                        disabled={ship.unique}
                                    >
                                        <Copy size={16} />
                                    </Button>

                                    <Button variant="ghost" size="sm" onClick={() => onRemove(ship.id)} className='p-1'>
                                        <Trash2 size={16} />
                                    </Button>

                                    {/* <Button variant="ghost" size="sm" onClick={toggleToolbar}>
                                        {isToolbarVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </Button> */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {isToolbarVisible && (
                        <div className='bg-gray-100 pb-2 h-full border rounded-b-xl dark:bg-gray-800'>
                            <UpgradeIconsToolbar
                                upgrades={ship.availableUpgrades}
                                onUpgradeClick={(upgrade, index) => onUpgradeClick(ship.id, upgrade, index)}
                                assignedUpgrades={ship.assignedUpgrades}
                                disabledUpgrades={disabledUpgrades}
                                enabledUpgrades={enabledUpgrades}
                                filledSlots={filledSlots}
                                hasCommander={hasCommander}
                                traits={ship.traits || []}
                            />

                            <div>
                                {ship.assignedUpgrades.map((upgrade, index) => (
                                    <SwipeableUpgrade
                                        key={`${upgrade.type}-${index}`}
                                        upgrade={upgrade}
                                        onSwipe={(direction) => {
                                            if (direction === 'left') {
                                                handleUpgradeRemove(upgrade.type, upgrade.slotIndex ?? index);
                                            } else if (direction === 'right') {
                                                onUpgradeClick(ship.id, upgrade.type, upgrade.slotIndex ?? index);
                                            }
                                        }}
                                        onSwap={() => onUpgradeClick(ship.id, upgrade.type, upgrade.slotIndex ?? index)}
                                        onRemove={() => handleUpgradeRemove(upgrade.type, upgrade.slotIndex ?? index)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-16 text-blue-500 bg-background" style={{ transform: 'translateX(-100%)' }}>
                    <Copy size={20} />
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-16 text-red-500 bg-background" style={{ transform: 'translateX(100%)' }}>
                    <Trash2 size={20} />
                </div>
            </animated.div>
        </div>
    );
}

interface SwipeableUpgradeProps {
    upgrade: Upgrade;
    onSwipe: (direction: 'left' | 'right') => void;
    onSwap: () => void;
    onRemove: () => void;
}

function SwipeableUpgrade({ upgrade, onSwipe, onSwap, onRemove }: SwipeableUpgradeProps) {
    const [{ x }, api] = useSpring(() => ({ x: 0 }));
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const isHorizontalSwipe = useRef(false);

    const SWIPE_THRESHOLD = 100;
    const ANGLE_THRESHOLD = 30; // Degrees

    const handleTouchStart = (e: React.TouchEvent) => {
        isDragging.current = true;
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        isHorizontalSwipe.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - startX.current;
        const deltaY = currentY - startY.current;

        if (!isHorizontalSwipe.current) {
            const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
            isHorizontalSwipe.current = angle < ANGLE_THRESHOLD || angle > (180 - ANGLE_THRESHOLD);
        }

        if (isHorizontalSwipe.current) {
            e.preventDefault();
            api.start({ x: deltaX, immediate: true });
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (isHorizontalSwipe.current) {
            const currentX = x.get();
            if (Math.abs(currentX) > SWIPE_THRESHOLD) {
                onSwipe(currentX < 0 ? 'left' : 'right');
            }
        }
        api.start({ x: 0, immediate: false });
        isHorizontalSwipe.current = false;
    };

    return (
        <animated.div
            style={{ x }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative"
        >
            <div className="px-2 py-1 mx-2 mt-2 flex items-center justify-between bg-white dark:bg-gray-700 rounded cursor-pointer" onClick={onSwap}>
                <div className="flex items-center flex-grow">
                    <Image
                        src={`/icons/${upgrade.type}.svg`}
                        alt={upgrade.type}
                        width={24}
                        height={24}
                        className="dark:invert mr-2"
                    />

                    <span className="font-medium flex items-center">
                        {upgrade.unique && <span className="mr-1">●</span>}
                        {upgrade.name}
                    </span>
                </div>

                <div className="flex items-center">
                    <span>{upgrade.points} pts</span>
                    <Button variant="ghost" size="sm" onClick={onRemove} className="p-1 ml-1">
                        <X size={16} />
                    </Button>
                </div>
            </div>

            <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-12 text-blue-500" style={{ transform: 'translateX(-100%)' }}>
                <ArrowLeftRight size={20} />
            </div>

            <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 text-red-500" style={{ transform: 'translateX(100%)' }}>
                <X size={20} />
            </div>
        </animated.div>
    );
}
