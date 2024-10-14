import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpring, animated, config } from 'react-spring';
import UpgradeIconsToolbar from './UpgradeIconsToolbar';
import { Ship, Upgrade } from "./FleetBuilder";
import { Copy, Trash2, ArrowLeftRight, X } from 'lucide-react';

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

export function SelectedShip({ ship, onRemove, onUpgradeClick, onCopy, handleRemoveUpgrade, disabledUpgrades, enabledUpgrades, filledSlots, hasCommander, traits }: SelectedShipProps) {
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [activeUpgrade, setActiveUpgrade] = useState<{ type: string, index: number } | null>(null);

  const [{ x: shipX }, shipApi] = useSpring(() => ({ x: 0 }));
  
  const isDragging = useRef(false);
  const startX = useRef(0);

  const SWIPE_THRESHOLD = 50;

  const handleShipTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
  };

  const handleShipTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX.current;
    shipApi.start({ x: deltaX, immediate: true });
  };

  const handleShipTouchEnd = () => {
    isDragging.current = false;
    const currentX = shipX.get();
    if (currentX < -SWIPE_THRESHOLD) {
      onRemove(ship.id);
    } else if (currentX > SWIPE_THRESHOLD) {
      onCopy(ship);
    }
    shipApi.start({ x: 0, immediate: false });
  };

  const handleUpgradeSwipe = (upgradeType: string, slotIndex: number, direction: 'left' | 'right') => {
    if (direction === 'left') {
      handleRemoveUpgrade(ship.id, upgradeType, slotIndex);
    } else {
      onUpgradeClick(ship.id, upgradeType, slotIndex);
    }
  };

  const toggleToolbar = () => {
    setIsToolbarVisible(!isToolbarVisible);
  };

  const totalShipPoints = ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + (upgrade.points || 0), 0);

  return (
    <div className="relative overflow-hidden mb-2">
      <animated.div style={{ x: shipX }}>
        <Card className="relative">
          <div
            onTouchStart={handleShipTouchStart}
            onTouchMove={handleShipTouchMove}
            onTouchEnd={handleShipTouchEnd}
          >
            <CardContent className="flex items-center p-2">
              <div className="w-16 aspect-[8/3] mr-4 relative overflow-hidden">
                <Image 
                  src={ship.cardimage} 
                  alt={ship.name}
                  layout="fill"
                  objectFit="cover"
                  objectPosition="top"
                  className="scale-[100%]"
                />
              </div>
              <div className="flex-grow">
                <span className="font-bold flex items-center">
                  {ship.unique && <span className="mr-1 text-yellow-500">●</span>}
                  {ship.name}
                </span>
                <div className="flex items-center">
                  <span className="mr-2">{totalShipPoints} points</span>
                </div>
              </div>
            </CardContent>
          </div>
          
          <Button
            variant="ghost"
            className="w-full text-left p-2 flex justify-between items-center"
            onClick={toggleToolbar}
          >
            <span>Upgrades</span>
            <span>{isToolbarVisible ? '▲' : '▼'}</span>
          </Button>
          
          {isToolbarVisible && (
            <>
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
              <div className="p-2 space-y-2">
                {ship.assignedUpgrades.map((upgrade, index) => (
                  <SwipeableUpgrade
                    key={`${upgrade.type}-${index}`}
                    upgrade={upgrade}
                    onSwipe={(direction) => handleUpgradeSwipe(upgrade.type, index, direction)}
                  />
                ))}
              </div>
            </>
          )}
        </Card>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-16 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          <Copy size={20} />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-16 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          <Trash2 size={20} />
        </div>
      </animated.div>
    </div>
  );
}

interface SwipeableUpgradeProps {
  upgrade: Upgrade;
  onSwipe: (direction: 'left' | 'right') => void;
}

function SwipeableUpgrade({ upgrade, onSwipe }: SwipeableUpgradeProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const isDragging = useRef(false);
  const startX = useRef(0);
  const SWIPE_THRESHOLD = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX.current;
    api.start({ x: deltaX, immediate: true });
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    const currentX = x.get();
    if (Math.abs(currentX) > SWIPE_THRESHOLD) {
      onSwipe(currentX < 0 ? 'left' : 'right');
    }
    api.start({ x: 0, immediate: false });
  };

  return (
    <div className="relative overflow-hidden mb-2">
      <animated.div
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative"
      >
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2">
          <div className="flex items-center">
            <Image
              src={`/icons/${upgrade.type}.svg`}
              alt={upgrade.type}
              width={24}
              height={24}
              className="dark:invert mr-2"
            />
            <span className="font-medium">
              {upgrade.unique && <span className="mr-1 text-yellow-500">●</span>}
              {upgrade.name}
            </span>
          </div>
          <span>{upgrade.points} pts</span>
        </div>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-12 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          <ArrowLeftRight size={20} />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          <X size={20} />
        </div>
      </animated.div>
    </div>
  );
}
