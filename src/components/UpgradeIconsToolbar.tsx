import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Upgrade } from './FleetBuilder';
import { useEffect, useState } from 'react';

interface UpgradeIconsToolbarProps {
  upgrades: string[];
  onUpgradeClick: (upgrade: string, index: number) => void;
  assignedUpgrades: Upgrade[];
}

const iconTypes = [
  'commander', 'officer', 'weapons-team', 'support-team', 'fleet-command',
  'fleet-support', 'offensive-retro', 'defensive-retro', 'experimental-retro',
  'turbolaser', 'ion-cannon', 'ordnance', 'super-weapon', 'title',
  'weapons-team-offensive-retro'
];

export default function UpgradeIconsToolbar({ upgrades, onUpgradeClick, assignedUpgrades }: UpgradeIconsToolbarProps) {
  const [preloadedIcons, setPreloadedIcons] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadIcons = async () => {
      const iconPromises = iconTypes.map(async (iconType) => {
        const iconUrl = `/icons/${iconType}.svg`;
        await fetch(iconUrl);
        setPreloadedIcons((prev) => new Set(prev).add(iconUrl));
      });
      await Promise.all(iconPromises);
    };

    preloadIcons();
  }, []);

  const upgradeCounts = upgrades.reduce((acc, upgrade) => {
    acc[upgrade] = (acc[upgrade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assignedUpgradeCounts = assignedUpgrades.reduce((acc, upgrade) => {
    acc[upgrade.type] = (acc[upgrade.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weaponsTeamCount = upgradeCounts['weapons-team'] || 0;
  const offensiveRetrofitCount = upgradeCounts['offensive-retro'] || 0;
  const combinedSlotCount = upgradeCounts['weapons-team-offensive-retro'] || 0;

  const assignedWeaponsTeam = assignedUpgradeCounts['weapons-team'] || 0;
  const assignedOffensiveRetrofit = assignedUpgradeCounts['offensive-retro'] || 0;
  const assignedCombinedSlot = assignedUpgradeCounts['weapons-team-offensive-retro'] || 0;

  const availableWeaponsTeam = weaponsTeamCount - assignedWeaponsTeam;
  const availableOffensiveRetrofit = offensiveRetrofitCount - assignedOffensiveRetrofit;

  const totalAssignedWeaponsTeam = assignedWeaponsTeam + assignedCombinedSlot;
  const totalAssignedOffensiveRetrofit = assignedOffensiveRetrofit + assignedCombinedSlot;

  return (
    <div 
      className="bg-gray-200 dark:bg-gray-800 p-2 flex justify-left space-x-2"
      onClick={(e) => e.stopPropagation()}
    >
      {Object.entries(upgradeCounts).flatMap(([upgrade, count]) => 
        Array(count).fill(0).map((_, index) => {
          let isDisabled = false;

          if (upgrade === 'weapons-team-offensive-retro') {
            isDisabled = (availableWeaponsTeam === 0 || availableOffensiveRetrofit === 0) ||
                         (index < assignedCombinedSlot);
          } else if (upgrade === 'weapons-team') {
            isDisabled = index < totalAssignedWeaponsTeam;
          } else if (upgrade === 'offensive-retro') {
            isDisabled = index < totalAssignedOffensiveRetrofit;
          } else {
            isDisabled = (assignedUpgradeCounts[upgrade] || 0) > index;
          }

          return (
            <Button
              key={`${upgrade}-${index}`}
              variant="ghost"
              size="icon"
              className={`h-8 p-1 ${upgrade === 'weapons-team-offensive-retro' ? 'w-16' : 'w-8'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && onUpgradeClick(upgrade, index)}
              disabled={isDisabled}
            >
              {preloadedIcons.has(`/icons/${upgrade}.svg`) && (
                <Image
                  src={`/icons/${upgrade}.svg`}
                  alt={upgrade}
                  width={upgrade === 'weapons-team-offensive-retro' ? 40 : 24}
                  height={24}
                  className={`dark:invert ${isDisabled ? 'opacity-50' : ''}`}
                />
              )}
            </Button>
          );
        })
      )}
    </div>
  );
}
