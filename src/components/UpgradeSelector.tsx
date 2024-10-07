import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Upgrade } from './FleetBuilder';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';

interface UpgradeSelectorProps {
  upgradeType: string;
  faction: string;
  onSelectUpgrade: (upgrade: Upgrade) => void;
  onClose: () => void;
  selectedUpgrades: Upgrade[];
  shipType?: string;
  chassis?: string;
}

export default function UpgradeSelector({
  upgradeType,
  faction,
  onSelectUpgrade,
  onClose,
  selectedUpgrades,
  shipType,
  chassis
}: UpgradeSelectorProps) {
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);
  const { uniqueClassNames, addUniqueClassName } = useUniqueClassContext();

  useEffect(() => {
    const fetchUpgrades = async () => {
      setLoading(true);
      try {
        let url = `https://api.swarmada.wiki/api/upgrades/search?type=${upgradeType}&faction=${faction}&include_neutral=true`;
        if (upgradeType === 'title' && chassis) {
          url += `&bound_shiptype=${encodeURIComponent(chassis)}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch upgrades');
        }
        const data = await response.json();
        const upgradesArray = Object.values(data.upgrades || {}) as Upgrade[];
        setUpgrades(upgradesArray);
      } catch (error) {
        console.error('Error fetching upgrades:', error);
        setUpgrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpgrades();
  }, [upgradeType, faction, chassis]);

  const isUpgradeAvailable = (upgrade: Upgrade) => {
    if (upgradeType === 'title') {
      if (upgrade.bound_shiptype && upgrade.bound_shiptype !== chassis) {
        return false;
      }
    } else {
      if (upgrade.bound_shiptype && upgrade.bound_shiptype !== shipType) {
        return false;
      }
    }

    if (upgrade.unique && selectedUpgrades.some(su => su.name === upgrade.name)) {
      return false;
    }

    return true;
  };

  const isUpgradeGreyedOut = (upgrade: Upgrade) => {
    return upgrade["unique-class"] && upgrade["unique-class"].some(uc => uniqueClassNames.includes(uc));
  };

  const handleUpgradeClick = (upgrade: Upgrade) => {
    if (isUpgradeAvailable(upgrade) && !isUpgradeGreyedOut(upgrade)) {
      onSelectUpgrade(upgrade);
      upgrade["unique-class"]?.forEach(addUniqueClassName);
    }
  };

  const validateImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://api.swarmada.wiki${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full h-full sm:w-11/12 sm:h-5/6 lg:w-3/4 lg:h-3/4 overflow-auto relative">
        <CardContent className="p-2 sm:p-4">
          <div className="flex justify-between items-center mb-2 sm:mb-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Select {upgradeType}</h2>
            <Button variant="ghost" onClick={onClose} className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          {loading ? (
            <p>Loading upgrades...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {upgrades.map((upgrade) => (
                <div key={upgrade.name} className="w-full aspect-[2/3]">
                  <Button
                    onClick={() => handleUpgradeClick(upgrade)}
                    className={`p-0 overflow-hidden relative w-full h-full rounded-lg ${
                      !isUpgradeAvailable(upgrade) || isUpgradeGreyedOut(upgrade) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!isUpgradeAvailable(upgrade) || isUpgradeGreyedOut(upgrade)}
                  >
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <Image
                        src={validateImageUrl(upgrade.cardimage)}
                        alt={upgrade.name}
                        layout="fill"
                        objectFit="cover"
                        objectPosition="center"
                        className="scale-[103%]"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-upgrade.png';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2">
                      <p className="text-xs sm:text-sm font-bold flex items-center justify-center">
                        {upgrade.unique && <span className="mr-1 text-yellow-500 text-xs sm:text-sm">●</span>}
                        <span className="break-words line-clamp-2 text-center">{upgrade.name}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-center">{upgrade.points} points</p>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}