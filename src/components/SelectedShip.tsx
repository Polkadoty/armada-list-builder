import { Card, CardContent } from "@/components/ui/card";
import { useState } from 'react';
import Image from 'next/image';
import UpgradeIconsToolbar from './UpgradeIconsToolbar';
import { Button } from "@/components/ui/button";
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
}

export function SelectedShip({ ship, onRemove, onUpgradeClick, onCopy, handleRemoveUpgrade, disabledUpgrades, enabledUpgrades, filledSlots, hasCommander}: SelectedShipProps) {

  const [isToolbarVisible, setIsToolbarVisible] = useState(true);

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
    handleRemoveUpgrade(ship.id, upgradeType, slotIndex);
  };

  return (
    <div className="mb-2">
      <Card className="relative">
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
            />
            <div className="p-2 space-y-2">
              {Object.entries(groupedUpgrades).map(([upgradeType, upgrades]) => (
                <div key={upgradeType}>
                  {upgrades.map((upgrade, index) => (
                    <div key={`${upgradeType}-${index}`} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2 mb-2">
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
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
