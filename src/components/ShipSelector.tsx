import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';

export interface ShipModel {
  id: string;
  name: string;
  points: number;
  cardimage: string;
  faction: string;
  upgrades?: string[];
  unique: boolean;
  chassis: string;
  size?: string;
  traits?: string[];
}

interface Ship {
  [key: string]: {
    models: {
      [key: string]: ShipModel;
    };
  };
}

interface ShipSelectorProps {
  faction: string;
  filter: { minPoints: number; maxPoints: number };
  onSelectShip: (ship: ShipModel) => void;
  onClose: () => void;
}

export function ShipSelector({ faction, filter, onSelectShip, onClose }: ShipSelectorProps) {
  const [ships, setShips] = useState<ShipModel[]>([]);
  const { uniqueClassNames, addUniqueClassName } = useUniqueClassContext();

  useEffect(() => {
    const fetchShips = async () => {
      const cachedShips = localStorage.getItem('ships');
      
      if (cachedShips) {
        const shipData: Ship = JSON.parse(cachedShips).ships;
        const flattenedShips = Object.entries(shipData).flatMap(([chassisName, chassisData]) => {
          return Object.values(chassisData.models).map(model => {
            const firstModelKey = Object.keys(chassisData.models)[0];
            const chassisSize = chassisData.models[firstModelKey].size;
            const filteredModel = Object.fromEntries(
              Object.entries({
                ...model,
                size: chassisSize,
                id: `${chassisName}-${model.name}`,
                traits: model.traits || [],
                chassis: chassisName,
              }).map(([key, value]) => {
                if (Array.isArray(value)) {
                  return [key, value.filter(item => item.trim() !== '')];
                }
                return [key, value];
              }).filter(([, value]) => value !== '' && value !== null && value !== undefined)
            ) as ShipModel;
            return filteredModel;
          }).filter(model => 
            model.faction === faction &&
            model.points >= filter.minPoints &&
            model.points <= filter.maxPoints
          );
        });
        setShips(flattenedShips);
      } else {
        console.error('Ships data not found in localStorage');
      }
    };

    fetchShips();
  }, [faction, filter.minPoints, filter.maxPoints]);

  const isShipAvailable = (ship: ShipModel) => {
    return !ship.unique || !uniqueClassNames.includes(ship.name);
  };

  const handleShipClick = (ship: ShipModel) => {
    if (isShipAvailable(ship)) {
      onSelectShip(ship);
      if (ship.unique) {
        addUniqueClassName(ship.name);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full h-full sm:w-11/12 sm:h-5/6 lg:w-3/4 lg:h-3/4 flex flex-col">
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Select a Ship</h2>
          <Button variant="ghost" onClick={onClose} className="p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {ships.map((ship) => (
              <div key={ship.id} className="w-full aspect-[8.75/15]">
                <Button
                  onClick={() => handleShipClick(ship)}
                  className={`p-0 overflow-hidden relative w-full h-full rounded-lg ${
                    !isShipAvailable(ship) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!isShipAvailable(ship)}
                >
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <Image
                      src={ship.cardimage}
                      alt={ship.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center scale-[103%]"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-ship.png';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2">
                    <p className="text-xs sm:text-sm font-bold flex items-center justify-center">
                      {ship.unique && <span className="mr-1 text-yellow-500 text-xs sm:text-sm">●</span>}
                      <span className="break-words line-clamp-2 text-center">{ship.name}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-center">{ship.points} points</p>
                  </div>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
