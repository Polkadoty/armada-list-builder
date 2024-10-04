import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

interface ShipModel {
  id: string;
  name: string;
  points: number;
  cardimage: string;
  faction: string;
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

  useEffect(() => {
    const fetchShips = async () => {
      const cacheKey = `ships_${faction}`;
      const cachedShips = localStorage.getItem(cacheKey);

      if (cachedShips) {
        setShips(JSON.parse(cachedShips));
      } else {
        try {
          const response = await axios.get(`https://api.swarmada.wiki/api/ships/search?faction=${faction}`);
          const shipData: Ship = response.data.ships;
          const flattenedShips = Object.values(shipData).flatMap(chassis => 
            Object.values(chassis.models).filter(model => 
              model.faction === faction &&
              model.points >= filter.minPoints &&
              model.points <= filter.maxPoints
            )
          );
          setShips(flattenedShips);
          localStorage.setItem(cacheKey, JSON.stringify(flattenedShips));
        } catch (error) {
          console.error('Error fetching ships:', error);
        }
      }
    };

    fetchShips();
  }, [faction, filter]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-3/4 h-3/4 overflow-auto">
        <CardContent>
          <h2 className="text-2xl font-bold mb-4">Select a Ship</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {ships.map((ship) => (
              <div key={ship.id} className="w-full aspect-[8.75/15]">
                <Button
                  onClick={() => onSelectShip(ship)}
                  className="p-0 overflow-hidden relative w-full h-full"
                >
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <Image
                      src={ship.cardimage}
                      alt={ship.name}
                      layout="fill"
                      objectFit="contain"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-ship.png'; // Replace with an actual placeholder image
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                    <p className="text-sm font-bold truncate">{ship.name}</p>
                    <p className="text-xs">{ship.points} points</p>
                  </div>
                </Button>
              </div>
            ))}
          </div>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    </div>
  );
}