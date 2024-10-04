import { Card, CardContent } from "@/components/ui/card";
import { useState } from 'react';
import Image from 'next/image';
import UpgradeIconsToolbar from './UpgradeIconsToolbar';

interface Ship {
    id: string;
    name: string;
    points: number;
    cardimage: string;
    faction: string;
    upgrades: string[];
  }

  interface SelectedShipProps {
    ship: Ship;
    onRemove: (id: string) => void;
  }
  
  export function SelectedShip({ ship, onRemove }: SelectedShipProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Card 
        className="mb-2 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="flex items-center p-2">
          <div className="w-16 h-16 mr-4 relative overflow-hidden">
            <Image 
              src={ship.cardimage} 
              alt={ship.name}
              layout="fill"
              objectFit="cover"
              objectPosition="top"
            />
          </div>
          <div className="flex-grow">
            <span className="font-bold">{ship.name}</span>
            <div className="flex items-center">
              <span className="mr-2">{ship.points} points</span>
              <button onClick={() => onRemove(ship.id)} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          </div>
        </CardContent>
        {isHovered && (
          <UpgradeIconsToolbar upgrades={ship.upgrades} />
        )}
      </Card>
    );
  }