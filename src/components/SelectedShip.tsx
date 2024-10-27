import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpring, animated } from 'react-spring';
import UpgradeIconsToolbar from './UpgradeIconsToolbar';
import { Ship, Upgrade } from "./FleetBuilder";
import { Copy, Trash2, ArrowLeftRight, X, Eye } from 'lucide-react';

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
  const [showImageModal, setShowImageModal] = useState(false);

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
      e.stopPropagation();
      api.start({ x: deltaX, immediate: true });
    } else if (Math.abs(deltaY) > 10) {
      isDragging.current = false;
      api.start({ x: 0, immediate: false });
    }
  };

  const handleShipTouchEnd = () => {
    if (!isDragging.current) return;
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

  const handleImageTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    // Only open modal if not swiping
    if (!isDragging.current) {
      setShowImageModal(true);
    }
  };



  return (
    <div className="relative overflow-hidden mb-2">
      <animated.div style={{ x }}>
        <Card className="relative">
          <div
            onTouchStart={handleShipTouchStart}
            onTouchMove={handleShipTouchMove}
            onTouchEnd={handleShipTouchEnd}
          >
            <CardContent className="p-0">
              <div className="relative w-full aspect-[8/3] overflow-hidden group">
                <Image 
                  src={ship.cardimage} 
                  alt={ship.name}
                  layout="fill"
                  objectFit="cover"
                  objectPosition="top"
                  className="scale-[103%]"
                  onClick={() => setShowImageModal(true)}
                />
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Only open modal if not swiping
                    if (!isDragging.current) {
                      setShowImageModal(true);
                    }
                  }}
                  onTouchEnd={handleImageTouch}
                >
                  <Eye size={24} className="text-white cursor-pointer" />
                </button>
              </div>
              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xl flex items-center">
                    {ship.unique && <span className="mr-1 text-yellow-500">●</span>}
                    {ship.name}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleToolbar}
                    className="ml-2"
                  >
                    <span>{isToolbarVisible ? '▲' : '▼'}</span>
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>{totalShipPoints} points</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onCopy(ship)} 
                      className={`text-blue-500 p-1 ${ship.unique ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={ship.unique}
                    >
                      <Copy size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRemove(ship.id)} className="text-red-500 p-1">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
          
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
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative">
            <Image
              src={ship.cardimage}
              alt={ship.name}
              width={420}
              height={630}
              className="rounded-lg w-auto h-[420px] sm:h-[630px] lg:h-[840px]"
            />
            <button
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
              onClick={() => setShowImageModal(false)}
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
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
  const [showImageModal, setShowImageModal] = useState(false);

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
      e.stopPropagation();
      api.start({ x: deltaX, immediate: true });
    } else if (Math.abs(deltaY) > 10) {
      isDragging.current = false;
      api.start({ x: 0, immediate: false });
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
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
    <div className="relative overflow-hidden mb-2">
      <animated.div
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative"
      >
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2">
          <div className="flex items-center min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Image
                src={`/icons/${upgrade.type}.svg`}
                alt={upgrade.type}
                width={24}
                height={24}
                className="dark:invert"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageModal(true)}
                className="p-1"
              >
                <Eye size={16} />
              </Button>
            </div>
            <span className="font-medium flex items-center ml-2">
              {upgrade.unique && <span className="mr-1 text-yellow-500">●</span>}
              {upgrade.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span>{upgrade.points} pts</span>
            <div className="hidden sm:flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onSwap} className="text-blue-500 p-1">
                <ArrowLeftRight size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-500 p-1">
                <X size={16} />
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-12 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          <ArrowLeftRight size={20} />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          <X size={20} />
        </div>
      </animated.div>
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative">
            <Image
              src={upgrade.cardimage}
              alt={upgrade.name}
              width={300}
              height={420}
              className="rounded-lg sm:w-[450px] sm:h-[630px] lg:w-[600px] lg:h-[840px]"
            />
            <button
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
              onClick={() => setShowImageModal(false)}
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


