import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Upgrade } from './FleetBuilder';

interface UpgradeSelectorProps {
  upgradeType: string;
  faction: string;
  onSelectUpgrade: (upgrade: Upgrade) => void;
  onClose: () => void;
  selectedUpgrades: Upgrade[];
  uniqueClassNames: string[];
  shipType?: string;
  isCommander?: boolean;
}

export default function UpgradeSelector({
  upgradeType,
  faction,
  onSelectUpgrade,
  onClose,
  selectedUpgrades,
  uniqueClassNames,
  shipType,
}: UpgradeSelectorProps) {
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpgrades = async () => {
      setLoading(true);
      try {
        let url = `https://api.swarmada.wiki/api/upgrades/search?type=${upgradeType}&faction=${faction}&include_neutral=true`;
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
  }, [upgradeType, faction]);

  const isUpgradeAvailable = (upgrade: Upgrade) => {
    if (upgrade.bound_shiptype && upgrade.bound_shiptype !== shipType) {
      return false;
    }

    if (upgrade.unique && selectedUpgrades.some(su => su.name === upgrade.name)) {
      return false;
    }

    if (upgrade["unique-class"] && upgrade["unique-class"].some(uc => uniqueClassNames.includes(uc))) {
      return false;
    }

    return true;
  };

  const validateImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://api.swarmada.wiki${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-3/4 h-3/4 overflow-auto">
        <CardContent>
          <h2 className="text-2xl font-bold mb-4">Select {upgradeType}</h2>
          {loading ? (
            <p>Loading upgrades...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {upgrades.filter(isUpgradeAvailable).map((upgrade) => (
                <div key={upgrade.name} className="w-full aspect-[2/3]">
                  <Button
                    onClick={() => onSelectUpgrade(upgrade)}
                    className="p-0 overflow-hidden relative w-full h-full rounded-lg"
                  >
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <Image
                        src={validateImageUrl(upgrade.cardimage)}
                        alt={upgrade.name}
                        layout="fill"
                        objectFit="cover"
                        objectPosition="center"
                        className="scale-[102%]"
                        onError={(e) => {
                          console.error(`Error loading image for ${upgrade.name}:`, upgrade.cardimage);
                          e.currentTarget.src = '/placeholder-upgrade.png';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                      <p className="text-sm font-bold truncate flex items-center justify-center">
                        {upgrade.unique && <span className="mr-1 text-yellow-500">●</span>}
                        {upgrade.name}
                      </p>
                      <p className="text-xs text-center">{upgrade.points} points</p>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button onClick={onClose} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    </div>
  );
}