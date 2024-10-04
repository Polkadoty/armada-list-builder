import Image from 'next/image';

interface UpgradeIconsToolbarProps {
  upgrades: string[];
}

export default function UpgradeIconsToolbar({ upgrades }: UpgradeIconsToolbarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-200 dark:bg-gray-800 p-2 flex justify-center space-x-2">
      {upgrades.map((upgrade, index) => (
        <div key={index} className="w-6 h-6 relative">
          <Image
            src={`/icons/${upgrade}.svg`}
            alt={upgrade}
            layout="fill"
            className="dark:invert"
          />
        </div>
      ))}
    </div>
  );
}