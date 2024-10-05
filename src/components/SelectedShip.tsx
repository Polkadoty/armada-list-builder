import { Card, CardContent } from "@/components/ui/card";
import { useState } from 'react';
import Image from 'next/image';
import UpgradeIconsToolbar from './UpgradeIconsToolbar';
import { Button } from "@/components/ui/button";

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
    onUpgradeClick: (shipId: string, upgrade: string) => void;
    onCopy: (ship: Ship) => void;
  }
  
  export function SelectedShip({ ship, onRemove, onUpgradeClick, onCopy }: SelectedShipProps) {
    const [isToolbarVisible, setIsToolbarVisible] = useState(false);

    const handleUpgradeClick = (upgrade: string) => {
      onUpgradeClick(ship.id, upgrade);
    };

    const toggleToolbar = () => {
      setIsToolbarVisible(!isToolbarVisible);
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
              <span className="font-bold">{ship.name}</span>
              <div className="flex items-center">
                <span className="mr-2">{ship.points} points</span>
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
            <UpgradeIconsToolbar upgrades={ship.upgrades} onUpgradeClick={handleUpgradeClick} />
          )}
        </Card>
      </div>
    );
  }