import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Upgrade } from './FleetBuilder';

interface UpgradeIconsToolbarProps {
  upgrades: string[];
  onUpgradeClick: (upgrade: string, index: number) => void;
  assignedUpgrades: Upgrade[];
}

export default function UpgradeIconsToolbar({ upgrades, onUpgradeClick, assignedUpgrades }: UpgradeIconsToolbarProps) {
  const isWeaponsTeamOrOffensiveRetrofitAssigned = assignedUpgrades.some(au => 
    au.type === 'weapons-team' || au.type === 'offensive-retro'
  );

  // Count the occurrences of each upgrade type
  const upgradeCounts = upgrades.reduce((acc, upgrade) => {
    acc[upgrade] = (acc[upgrade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count the assigned upgrades
  const assignedUpgradeCounts = assignedUpgrades.reduce((acc, upgrade) => {
    acc[upgrade.type] = (acc[upgrade.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div 
      className="bg-gray-200 dark:bg-gray-800 p-2 flex justify-left space-x-2"
      onClick={(e) => e.stopPropagation()}
    >
      {Object.entries(upgradeCounts).flatMap(([upgrade, count]) => 
        Array(count).fill(0).map((_, index) => {
          const isAssigned = (assignedUpgradeCounts[upgrade] || 0) > index;
          const isDisabled = isAssigned || (upgrade === 'weapons-team-offensive-retro' && isWeaponsTeamOrOffensiveRetrofitAssigned);
          return (
            <Button
              key={`${upgrade}-${index}`}
              variant="ghost"
              size="icon"
              className={`h-8 p-1 ${upgrade === 'weapons-team-offensive-retro' ? 'w-16' : 'w-8'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isDisabled && onUpgradeClick(upgrade, index)}
              disabled={isDisabled}
            >
              <Image
                src={`/icons/${upgrade}.svg`}
                alt={upgrade}
                width={upgrade === 'weapons-team-offensive-retro' ? 40 : 24}
                height={24}
                className={`dark:invert ${isDisabled ? 'opacity-50' : ''}`}
              />
            </Button>
          );
        })
      )}
    </div>
  );
}