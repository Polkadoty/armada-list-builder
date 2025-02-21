import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Upgrade } from './FleetBuilder';

interface UpgradeIconsToolbarProps {
  upgrades: string[];
  onUpgradeClick: (upgrade: string, index: number) => void;
  assignedUpgrades: Upgrade[];
  disabledUpgrades: string[];
  enabledUpgrades: string[];
  filledSlots: Record<string, number[]>;
  hasCommander: boolean;
  traits: string[];
  greyUpgrades: string[];
}

export default function UpgradeIconsToolbar({ upgrades, onUpgradeClick, assignedUpgrades, disabledUpgrades, enabledUpgrades, filledSlots, hasCommander, greyUpgrades }: UpgradeIconsToolbarProps) {
  const upgradeCounts = upgrades.reduce((acc, upgrade) => {
    acc[upgrade] = (acc[upgrade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter out empty strings and add enabled upgrades to the counts
  enabledUpgrades.filter(upgrade => upgrade.trim() !== '').forEach(upgrade => {
    if (!upgradeCounts[upgrade]) {
      upgradeCounts[upgrade] = 1;
    } else {
      upgradeCounts[upgrade]++;
    }
  });

  const assignedUpgradeCounts = assignedUpgrades.reduce((acc, upgrade) => {
    acc[upgrade.type] = (acc[upgrade.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const usedWeaponsTeamSlots = (assignedUpgradeCounts['weapons-team'] || 0) + (assignedUpgradeCounts['weapons-team-offensive-retro'] || 0);
  const usedOffensiveRetroSlots = (assignedUpgradeCounts['offensive-retro'] || 0) + (assignedUpgradeCounts['weapons-team-offensive-retro'] || 0);

  const iconSize = 32; // Minimum size for each icon button

  // Count how many slots of each type have been greyed out
  const greyedSlotCounts = greyUpgrades.reduce((acc, upgrade) => {
    acc[upgrade] = (acc[upgrade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div 
      className="bg-white dark:bg-gray-900 p-2 flex flex-wrap justify-left backdrop-blur-md bg-opacity-30 dark:bg-opacity-30"
      onClick={(e) => e.stopPropagation()}
    >
      {Object.entries(upgradeCounts).flatMap(([upgrade, count]) => 
        Array(count).fill(0).map((_, index) => {
          // Count how many slots of this type have already been processed
          const previousSlotsOfType = index;
          const isGreyedOut = greyUpgrades.includes(upgrade) && 
            previousSlotsOfType < (greyedSlotCounts[upgrade] || 0);

          const isDisabled = 
            disabledUpgrades.includes(upgrade) || 
            (upgrade === 'title' && assignedUpgrades.some(u => u.type === 'title')) ||
            (upgrade === 'commander' && hasCommander) ||
            (upgrade === 'weapons-team' && (
              usedWeaponsTeamSlots >= upgradeCounts['weapons-team'] ||
              (filledSlots['weapons-team-offensive-retro'] && filledSlots['weapons-team-offensive-retro'].includes(index))
            )) ||
            (upgrade === 'offensive-retro' && (
              usedOffensiveRetroSlots >= upgradeCounts['offensive-retro'] ||
              (filledSlots['weapons-team-offensive-retro'] && filledSlots['weapons-team-offensive-retro'].includes(index))
            )) ||
            (upgrade === 'weapons-team-offensive-retro' && 
              (usedWeaponsTeamSlots >= upgradeCounts['weapons-team'] || 
               usedOffensiveRetroSlots >= upgradeCounts['offensive-retro'])) ||
            (assignedUpgradeCounts[upgrade] && assignedUpgradeCounts[upgrade] >= upgradeCounts[upgrade]) ||
            (filledSlots[upgrade] && filledSlots[upgrade].includes(index));

          return (
            <Button
              key={`${upgrade}-${index}`}
              variant="ghost"
              size="icon"
              className={`m-1 ${isDisabled || isGreyedOut ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                width: `${upgrade === 'weapons-team-offensive-retro' ? iconSize * 2 : iconSize}px`,
                height: `${iconSize}px`,
                padding: '4px',
                minWidth: `${upgrade === 'weapons-team-offensive-retro' ? iconSize * 2 : iconSize}px`,
                flexGrow: 0,
                flexShrink: 0,
              }}
              onClick={() => !(isDisabled || isGreyedOut) && onUpgradeClick(upgrade, index)}
            >
              <Image
                src={`/icons/${upgrade}.svg`}
                alt={upgrade}
                width={upgrade === 'weapons-team-offensive-retro' ? 45 : 32}
                height={40}
                className={`dark:invert ${isDisabled || isGreyedOut ? 'opacity-50' : ''}`}
              />
            </Button>
          );
        })
      )}
    </div>
  );
}
