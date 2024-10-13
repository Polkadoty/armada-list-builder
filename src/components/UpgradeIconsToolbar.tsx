import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Upgrade } from './FleetBuilder';

interface UpgradeIconsToolbarProps {
  upgrades: string[];
  onUpgradeClick: (upgrade: string, index: number) => void;
  assignedUpgrades: Upgrade[];
  disabledUpgrades: string[];
  enabledUpgrades: string[];
}

export default function UpgradeIconsToolbar({ upgrades, onUpgradeClick, assignedUpgrades, disabledUpgrades, enabledUpgrades }: UpgradeIconsToolbarProps) {
  const upgradeCounts = upgrades.reduce((acc, upgrade) => {
    acc[upgrade] = (acc[upgrade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Add enabled upgrades to the counts
  enabledUpgrades.forEach(upgrade => {
    if (!upgradeCounts[upgrade]) {
      upgradeCounts[upgrade] = 1;
    }
  });

  const assignedUpgradeCounts = assignedUpgrades.reduce((acc, upgrade) => {
    acc[upgrade.type] = (acc[upgrade.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weaponsTeamCount = upgradeCounts['weapons-team'] || 0;
  const offensiveRetrofitCount = upgradeCounts['offensive-retro'] || 0;

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
            isDisabled = (assignedUpgradeCounts[upgrade] || 0) > index || 
                         disabledUpgrades.includes(upgrade) || 
                         (upgrade === 'title' && assignedUpgrades.some(u => u.type === 'title'));
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
