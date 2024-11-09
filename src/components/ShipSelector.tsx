import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from '@/components/OptimizedImage';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Cookies from 'js-cookie';
import { ContentSource } from './FleetBuilder';

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
  source: ContentSource;
  speed: Record<string, number[]>;
  tokens: Record<string, number>;
  armament: Record<string, number[]>;
  searchableText: string;
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
  const [activeSorts, setActiveSorts] = useState<Record<SortOption, 'asc' | 'desc' | null>>(() => {
    const savedSorts = Cookies.get(`sortState_ships`);
    if (savedSorts) {
      return JSON.parse(savedSorts);
    }
    return {
      alphabetical: null,
      points: null,
      unique: null,
      custom: null
    };
  });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchShips = () => {
      const cachedShips = localStorage.getItem('ships');
      const cachedLegacyShips = localStorage.getItem('legacyShips');
      const cachedLegendsShips = localStorage.getItem('legendsShips');
      const cachedOldLegacyShips = localStorage.getItem('oldLegacyShips');
      const cachedArcShips = localStorage.getItem('arcShips');
      
      // Get errata keys for ships
      const errataKeysJson = localStorage.getItem('errataKeys');
      const errataKeys = errataKeysJson ? JSON.parse(errataKeysJson).ships : [];
      

      
        // Add this helper function at the top of the file
      const normalizeSourceName = (source: string): ContentSource => {
        switch (source.toLowerCase()) {
          case 'old-legacy':
            return 'oldLegacy';
          case 'legacy':
            return 'legacy';
          case 'legends':
            return 'legends';
          case 'arc':
            return 'arc';
          default:
            return 'regular';
        }
      };

      const processShips = (data: ShipData, prefix: string = '') => {
        console.log('Processing ships with prefix:', prefix);
        const contentEnabled = prefix === '' || prefix === 'regular' || Cookies.get(`enable${prefix.charAt(0).toUpperCase() + prefix.slice(1)}`) === 'true';
        
        if (!contentEnabled) return [];

        const shipMap = new Map<string, ShipModel>();

        if (data && data.ships) {
          // First, collect all errata information
          const errataModels = new Map<string, { modelId: string, model: ShipModel, chassisData: ChassisData }>();
          
          Object.entries(data.ships).forEach(([chassisName, chassisData]) => {
            if (chassisName.includes('-errata-')) {
              const [baseChassisName, errataSource] = chassisName.split('-errata-');
              const errataEnabled = Cookies.get(`enable${errataSource.charAt(0).toUpperCase() + errataSource.slice(1)}`) === 'true';
              
              if (errataEnabled) {
                Object.entries(chassisData.models || {}).forEach(([modelId, model]) => {
                  if (modelId.includes('-errata-') && errataKeys.includes(chassisName)) {
                    const baseModelId = modelId.split('-errata-')[0];
                    
                    console.log('Found errata model:', {
                      baseModelId,
                      modelId,
                      errataSource,
                      chassisName
                    });

                    errataModels.set(baseModelId, {
                      modelId,
                      model: {
                        ...model,
                        id: modelId,
                        chassis: baseChassisName, // Keep the original chassis name
                        source: normalizeSourceName(errataSource)
                      },
                      chassisData
                    });
                  }
                });
              }
            }
          });

          console.log('Collected errata models:', Array.from(errataModels.entries()));

          // Then process all ships
          Object.entries(data.ships).forEach(([chassisName, chassisData]) => {
            if (!chassisName.includes('-errata-')) {
              Object.entries(chassisData.models || {}).forEach(([modelId, model]) => {
                if (!modelId.includes('-errata-') && model.faction === faction) {
                  const errataData = errataModels.get(modelId);
                  
                  if (errataData) {
                    console.log('Replacing ship with errata version:', {
                      originalId: modelId,
                      errataId: errataData.modelId,
                      chassis: model.chassis
                    });
                  }

                  const ship = errataData ? {
                    ...errataData.model,
                    size: errataData.chassisData.size,
                    traits: errataData.model.traits || [],
                    chassis: model.chassis, // Keep the original chassis
                    searchableText: createSearchableText(errataData.model)
                  } : {
                    ...model,
                    id: modelId,
                    chassis: model.chassis,
                    size: chassisData.size,
                    traits: model.traits || [],
                    source: (prefix || 'regular') as ContentSource,
                    searchableText: createSearchableText(model)
                  };
                  shipMap.set(modelId, ship);
                }
              });
            }
          });
        }

        const processedShips = Array.from(shipMap.values());
        console.log('Processed ships:', processedShips);
        return processedShips;
      };

      // Helper function to create searchable text
      const createSearchableText = (model: ShipModel) => {
        const speedText = Object.entries(model.speed || {})
          .map(([speed, yaw]) => `speed ${speed} yaw ${yaw.join(' ')}`)
          .join(' ');
        const armamentText = Object.entries(model.armament || {}).map(([zone, dice]) => {
          const diceColors = ['red', 'blue', 'black'];
          return dice.map((count, index) => count > 0 ? `${zone} ${diceColors[index]} ${count}` : '').filter(Boolean);
        }).flat().join(' ');
        const upgradesText = model.upgrades?.join(' ') || '';

        return JSON.stringify({
          ...model,
          name: model.name.toLowerCase(),
          speed: speedText,
          armament: armamentText,
          upgrades: upgradesText,
          traits: model.traits?.map(trait => ` ${trait} `).join(' ') || '',
          tokens: Object.entries(model.tokens || {})
            .filter(([_key, value]) => value > 0)
            .reduce((acc, [key, value]) => ({ ...acc, [key.replace('def_', '')]: value }), {})
        }).toLowerCase();
      };

      let allShips: ShipModel[] = [];

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

      if (cachedOldLegacyShips) {
        const oldLegacyShipData = JSON.parse(cachedOldLegacyShips);
        allShips = [...allShips, ...processShips(oldLegacyShipData, 'oldLegacy')];
      }

      if (cachedArcShips) {
        const arcShipData = JSON.parse(cachedArcShips);
        allShips = [...allShips, ...processShips(arcShipData, 'arc')];
      }

      // Remove duplicates by using a Map with a composite key
      const uniqueShips = new Map<string, ShipModel>();
      allShips.forEach(ship => {
        const key = ship.id.split('-errata-')[0]; // Use base ID as key
        const existingShip = uniqueShips.get(key);
        
        // Replace existing ship if:
        // 1. No existing ship OR
        // 2. New ship is from arc OR
        // 3. New ship is an errata version and its source is enabled
        const isErrata = ship.id.includes('-errata-');
        const errataSource = isErrata ? ship.id.split('-errata-')[1] : '';
        const errataEnabled = isErrata && Cookies.get(`enable${errataSource.charAt(0).toUpperCase() + errataSource.slice(1)}`) === 'true';
        
        if (!existingShip || 
            ship.source === 'arc' || 
            (isErrata && errataEnabled)) {
          uniqueShips.set(key, ship);
        }
      });

      // Convert back to array and filter
      const filteredShips = Array.from(uniqueShips.values())
        .filter(ship => ship.faction === faction);

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
          const searchLower = searchQuery.toLowerCase();
          return ship.searchableText.includes(searchLower);
        });
      }

      const sortFunctions: Record<SortOption, (a: ShipModel, b: ShipModel) => number> = {
        custom: (a, b) => {
          if (a.source === b.source) return 0;
          if (a.source !== 'regular' && b.source === 'regular') return -1;
          if (a.source === 'regular' && b.source !== 'regular') return 1;
          return 0;
        },
        unique: (a, b) => (a.unique === b.unique ? 0 : a.unique ? -1 : 1),
        points: (a, b) => a.points - b.points,
        alphabetical: (a, b) => a.name.localeCompare(b.name),
      };

      const sortPriority: SortOption[] = ['custom', 'unique', 'points', 'alphabetical'];

      sortedShips.sort((a, b) => {
        // Always keep huge ships at the end
        if (a.size === 'huge' && b.size !== 'huge') return 1;
        if (a.size !== 'huge' && b.size === 'huge') return -1;

        // If no active sorts, use default sorting (alphabetical with unique at bottom)
        if (Object.values(activeSorts).every(sort => sort === null)) {
          if (a.unique && !b.unique) return 1;
          if (!a.unique && b.unique) return -1;
          return a.name.localeCompare(b.name);
        }

        // Apply active sorts
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
    setActiveSorts(prevSorts => {
      const newSorts = {
        ...prevSorts,
        [option]: prevSorts[option] === null ? 'asc' : prevSorts[option] === 'asc' ? 'desc' : null
      };
      Cookies.set(`sortState_ships`, JSON.stringify(newSorts), { expires: 365 });
      return newSorts;
    });
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

  const isHugeShip = (ship: ShipModel) => ship.size === 'huge';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30">
      <Card className="w-full h-full sm:w-[95%] sm:h-[90%] lg:w-[85%] lg:h-[85%] flex flex-col">
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
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mr-2">Ship</h2>
              <Search size={20} />
            </Button>
          )}
          <div className="flex items-center">
            {showSearch && (
              <Button variant="ghost" onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="mr-2">
                <X size={20} />
              </Button>
            )}
            <SortToggleGroup activeSorts={activeSorts} onToggle={handleSortToggle} selectorType="ships" />
            <Button variant="ghost" onClick={onClose} className="p-1 ml-2">
              <X size={20} />
            </Button>
          </div>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
            {displayedShips.map((ship) => (
              <div key={ship.id} className={`w-full ${isHugeShip(ship) ? 'col-span-2 aspect-[5/4]' : 'aspect-[8.75/15]'}`}>
                <Button
                  onClick={() => handleShipClick(ship)}
                  className={`p-0 overflow-visible relative w-full h-full rounded-lg bg-transparent ${
                    !isShipAvailable(ship) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={!isShipAvailable(ship)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <OptimizedImage
                      src={ship.cardimage}
                      alt={ship.name}
                      width={isHugeShip(ship) ? 600 : 300}
                      height={isHugeShip(ship) ? 480 : 420}
                      className="object-cover object-center scale-[103%]"
                      onError={() => {}}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2 visually-hidden">
                    <p className="text-xs sm:text-xs font-bold flex items-center justify-center mb-0.5">
                      {ship.unique && <span className="mr-1 text-yellow-500 text-[10px] sm:text-xs">●</span>}
                      <span className="break-words text-center">{ship.name}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-center">{ship.points} points</p>
                  </div>
                  <div className="sr-only">
                    {JSON.stringify(ship)}
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
