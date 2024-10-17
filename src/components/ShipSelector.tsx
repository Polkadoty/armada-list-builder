import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { Pencil, Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";

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
  type: 'regular' | 'legacy' | 'legends';
}

interface ShipData {
  ships: Record<string, ChassisData>;
}

interface ChassisData {
  models: Record<string, ShipModel>;
  size: string;
}

interface ShipSelectorProps {
  faction: string;
  filter: { minPoints: number; maxPoints: number };
  onSelectShip: (ship: ShipModel) => void;
  onClose: () => void;
}

export function ShipSelector({ faction, filter, onSelectShip, onClose }: ShipSelectorProps) {
  const [allShips, setAllShips] = useState<ShipModel[]>([]);
  const [displayedShips, setDisplayedShips] = useState<ShipModel[]>([]);
  const { uniqueClassNames, addUniqueClassName } = useUniqueClassContext();
  const [activeSorts, setActiveSorts] = useState<Record<SortOption, 'asc' | 'desc' | null>>({
    alphabetical: null,
    points: null,
    unique: null,
    custom: null
  });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchShips = () => {
      const cachedShips = localStorage.getItem('ships');
      const cachedLegacyShips = localStorage.getItem('legacyShips');
      const cachedLegendsShips = localStorage.getItem('legendsShips');
      
      let allShips: ShipModel[] = [];

      const processShips = (data: ShipData, prefix: string = '') => {
        if (data && data.ships) {
          return Object.entries(data.ships).flatMap(([chassisName, chassisData]: [string, ChassisData]) => 
            Object.values(chassisData.models || {}).map((model: ShipModel) => ({
              ...model,
              id: prefix ? `${prefix}-${chassisName}-${model.name}` : `${chassisName}-${model.name}`,
              chassis: chassisName,
              size: chassisData.size,
              traits: model.traits || [],
              type: (prefix || 'regular') as 'regular' | 'legacy' | 'legends'
            }))
          );
        }
        return [];
      };

      if (cachedShips) {
        const shipData = JSON.parse(cachedShips);
        allShips = [...allShips, ...processShips(shipData)];
      }

      if (cachedLegacyShips) {
        const legacyShipData = JSON.parse(cachedLegacyShips);
        allShips = [...allShips, ...processShips(legacyShipData, 'legacy')];
      }

      if (cachedLegendsShips) {
        const legendsShipData = JSON.parse(cachedLegendsShips);
        allShips = [...allShips, ...processShips(legendsShipData, 'legends')];
      }

      const filteredShips = allShips.filter(ship => 
        ship.faction === faction &&
        ship.points >= filter.minPoints &&
        ship.points <= filter.maxPoints
      );

      setAllShips(filteredShips);
      setDisplayedShips(filteredShips);
    };

    fetchShips();
  }, [faction, filter.minPoints, filter.maxPoints]);

  useEffect(() => {
    const sortAndFilterShips = () => {
      let sortedShips = [...allShips];

      // Filter ships based on search query
      if (searchQuery) {
        sortedShips = sortedShips.filter(ship => {
          const shipName = ship.name || '';
          const searchLower = searchQuery.toLowerCase();
          return shipName.toLowerCase().includes(searchLower);
        });
      }

      const sortFunctions: Record<SortOption, (a: ShipModel, b: ShipModel) => number> = {
        custom: (a, b) => {
          if (a.type === b.type) return 0;
          if (a.type !== 'regular' && b.type === 'regular') return -1;
          if (a.type === 'regular' && b.type !== 'regular') return 1;
          return 0;
        },
        unique: (a, b) => (a.unique === b.unique ? 0 : a.unique ? -1 : 1),
        points: (a, b) => a.points - b.points,
        alphabetical: (a, b) => a.name.localeCompare(b.name),
      };

      const sortPriority: SortOption[] = ['custom', 'unique', 'points', 'alphabetical'];

      sortedShips.sort((a, b) => {
        for (const option of sortPriority) {
          if (activeSorts[option] !== null) {
            const result = sortFunctions[option](a, b);
            if (result !== 0) {
              return activeSorts[option] === 'asc' ? result : -result;
            }
          }
        }
        return 0;
      });

      setDisplayedShips(sortedShips);
    };

    sortAndFilterShips();
  }, [allShips, activeSorts, searchQuery]);

  const handleSortToggle = (option: SortOption) => {
    setActiveSorts(prevSorts => ({
      ...prevSorts,
      [option]: prevSorts[option] === null ? 'asc' : prevSorts[option] === 'asc' ? 'desc' : null
    }));
  };

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
          {showSearch ? (
            <div className="flex-grow mr-2 relative">
              <Input
                type="text"
                placeholder="Search ships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10"
                autoFocus
              />
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setShowSearch(true)} className="flex items-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mr-2">Select a Ship</h2>
              <Pencil size={20} />
            </Button>
          )}
          <div className="flex items-center">
            {showSearch && (
              <Button variant="ghost" onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="mr-2">
                <X size={20} />
              </Button>
            )}
            <SortToggleGroup activeSorts={activeSorts} onToggle={handleSortToggle} />
            <Button variant="ghost" onClick={onClose} className="p-1 ml-2">
              <X size={20} />
            </Button>
          </div>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {displayedShips.map((ship) => (
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
                    <p className="text-xs sm:text-xs font-bold flex items-center justify-center mb-0.5">
                      {ship.unique && <span className="mr-1 text-yellow-500 text-[10px] sm:text-xs">●</span>}
                      <span className="break-words text-center">{ship.name}</span>
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
