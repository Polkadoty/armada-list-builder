import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Upgrade } from './FleetBuilder';

interface UpgradeIconsToolbarProps {
  upgrades: string[];
  onUpgradeClick: (upgrade: string) => void;
  assignedUpgrades: Upgrade[];
}

export default function UpgradeIconsToolbar({ upgrades, onUpgradeClick, assignedUpgrades }: UpgradeIconsToolbarProps) {
  const isWeaponsTeamOrOffensiveRetrofitAssigned = assignedUpgrades.some(au => 
    au.type === 'weapons-team' || au.type === 'offensive-retro'
  );

  return (
    <div 
      className="bg-gray-200 dark:bg-gray-800 p-2 flex justify-left space-x-2"
      onClick={(e) => e.stopPropagation()}
    >
      {upgrades.map((upgrade, index) => {
        const isAssigned = assignedUpgrades.some(au => au.type === upgrade);
        const isDisabled = isAssigned || (upgrade === 'weapons-team-offensive-retro' && isWeaponsTeamOrOffensiveRetrofitAssigned);
        return (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className={`h-8 p-1 ${upgrade === 'weapons-team-offensive-retro' ? 'w-16' : 'w-8'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isDisabled && onUpgradeClick(upgrade)}
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
      })}
    </div>
  );
}