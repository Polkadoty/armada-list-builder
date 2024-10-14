import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSwipeable } from 'react-swipeable';
import UpgradeIconsToolbar from './UpgradeIconsToolbar';
import { Ship } from "./FleetBuilder";
import { Upgrade } from "./FleetBuilder";

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

export function SelectedShip({ ship, onRemove, onUpgradeClick, onCopy, handleRemoveUpgrade, disabledUpgrades, enabledUpgrades, filledSlots, hasCommander}: SelectedShipProps) {
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [activeUpgrade, setActiveUpgrade] = useState<{ type: string, index: number } | null>(null);
  const [upgradeSwipeOffset, setUpgradeSwipeOffset] = useState(0);

  const handleUpgradeClick = (upgrade: string, index: number) => {
    onUpgradeClick(ship.id, upgrade, index);
  };

  const toggleToolbar = () => {
    setIsToolbarVisible(!isToolbarVisible);
  };

  const getUpgradeSlots = () => {
    return ship.availableUpgrades;
  };

  const totalShipPoints = ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + (upgrade.points || 0), 0);

  // Group upgrades by type, including enabled upgrades and preserving duplicates
  const groupedUpgrades = [...getUpgradeSlots(), ...enabledUpgrades].reduce((acc, upgradeType) => {
    if (!acc[upgradeType]) {
      acc[upgradeType] = [];
    }
    const assignedUpgrades = ship.assignedUpgrades.filter(u => u.type === upgradeType);
    acc[upgradeType] = assignedUpgrades;
    return acc;
  }, {} as Record<string, Upgrade[]>);

  const handleRemoveUpgradeClick = (upgradeType: string, slotIndex: number) => {
    console.log('Removing upgrade:', upgradeType, slotIndex);
    const upgradeToRemove = ship.assignedUpgrades.find(u => u.type === upgradeType && u.slotIndex === slotIndex);
    
    if (upgradeToRemove && upgradeToRemove.restrictions?.enable_upgrades) {
      // Remove the main upgrade and all enabled upgrades
      const upgradesToRemove = [upgradeToRemove, ...ship.assignedUpgrades.filter(u => 
        upgradeToRemove.restrictions?.enable_upgrades?.includes(u.type)
      )];
      
      upgradesToRemove.forEach(upgrade => {
        handleRemoveUpgrade(ship.id, upgrade.type, upgrade.slotIndex ?? slotIndex);
      });
    } else {
      // Remove only the clicked upgrade
      handleRemoveUpgrade(ship.id, upgradeType, slotIndex);
    }
  };

  const shipSwipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      setSwipeOffset(eventData.deltaX);
    },
    onSwipedLeft: () => {
      if (swipeOffset < -50) {
        onRemove(ship.id);
      }
      setSwipeOffset(0);
    },
    onSwipedRight: () => {
      if (swipeOffset > 50) {
        onCopy(ship);
      }
      setSwipeOffset(0);
    },
    onSwiped: () => {
      setSwipeOffset(0);
    },
    trackMouse: true
  });

  const upgradeSwipeHandlers = useSwipeable({
    onSwipeStart: (eventData) => {
      const target = eventData.event.target as HTMLElement;
      const upgradeElement = target.closest('[data-upgrade-type]');
      if (upgradeElement instanceof HTMLElement) {
        const type = upgradeElement.dataset.upgradeType;
        const indexStr = upgradeElement.dataset.upgradeIndex;
        if (type && indexStr) {
          const index = parseInt(indexStr, 10);
          setActiveUpgrade({ type, index });
        }
      }
    },
    onSwiping: (eventData) => {
      if (activeUpgrade) {
        setUpgradeSwipeOffset(eventData.deltaX);
      }
    },
    onSwipedLeft: () => {
      if (activeUpgrade && Math.abs(upgradeSwipeOffset) > 50) {
        handleRemoveUpgradeClick(activeUpgrade.type, activeUpgrade.index);
      }
      setUpgradeSwipeOffset(0);
      setActiveUpgrade(null);
    },
    onSwipedRight: () => {
      if (activeUpgrade && upgradeSwipeOffset > 50) {
        handleUpgradeClick(activeUpgrade.type, activeUpgrade.index);
      }
      setUpgradeSwipeOffset(0);
      setActiveUpgrade(null);
    },
    onSwiped: () => {
      setUpgradeSwipeOffset(0);
      setActiveUpgrade(null);
    },
    trackMouse: true
  });

  return (
    <div className="mb-2 overflow-hidden">
      <Card className="relative">
        <div {...shipSwipeHandlers} className="relative" style={{ transform: `translateX(${swipeOffset}px)`, transition: 'transform 0.2s ease-out' }}>
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
                <button onClick={(e) => { e.stopPropagation(); onCopy(ship); }} className="text-blue-500 hover:text-blue-700 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRemove(ship.id); }} className="text-red-500 hover:text-red-700">
                  ✕
                </button>
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
              upgrades={getUpgradeSlots()}
              onUpgradeClick={handleUpgradeClick}
              assignedUpgrades={ship.assignedUpgrades}
              disabledUpgrades={disabledUpgrades}
              enabledUpgrades={enabledUpgrades}
              filledSlots={filledSlots}
              hasCommander={hasCommander}
              traits={ship.traits || []}
            />
            <div className="p-2 space-y-2">
              {Object.entries(groupedUpgrades).map(([upgradeType, upgrades]) => (
                <div key={upgradeType}>
                  {upgrades.map((upgrade, index) => {
                    const slotIndex = upgrade.slotIndex ?? index;
                    const isActive = activeUpgrade?.type === upgradeType && activeUpgrade?.index === slotIndex;
                    
                    return (
                      <div 
                        key={`${upgradeType}-${slotIndex.toString()}`} 
                        className="overflow-hidden"
                        {...upgradeSwipeHandlers}
                        data-upgrade-type={upgradeType}
                        data-upgrade-index={slotIndex.toString()}
                      >
                        <div 
                          className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2 mb-2"
                          style={{ transform: `translateX(${isActive ? upgradeSwipeOffset : 0}px)`, transition: 'transform 0.2s ease-out' }}
                        >
                          <div className="flex items-center">
                            <Image
                              src={`/icons/${upgradeType}.svg`}
                              alt={upgradeType}
                              width={24}
                              height={24}
                              className="dark:invert mr-2"
                            />
                            <span className="font-medium">
                              {upgrade.unique && <span className="mr-1 text-yellow-500">●</span>}
                              {upgrade.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">{upgrade.points} pts</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 mr-1"
                              onClick={() => handleUpgradeClick(upgradeType, index)}
                              disabled={disabledUpgrades.includes(upgradeType)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8 3L4 7l4 4"/>
                                <path d="M4 7h16"/>
                                <path d="m16 21 4-4-4-4"/>
                                <path d="M20 17H4"/>
                              </svg>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveUpgradeClick(upgradeType, upgrade.slotIndex ?? index)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
