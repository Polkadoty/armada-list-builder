import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from '@/components/OptimizedImage';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Cookies from 'js-cookie';
import { ContentSource } from './FleetBuilder';
import { sanitizeImageUrl } from '@/utils/dataFetcher';

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
  const [contentSources, setContentSources] = useState(() => ({
    arc: Cookies.get('enableArc') === 'true',
    legacy: Cookies.get('enableLegacy') === 'true',
    legends: Cookies.get('enableLegends') === 'true',
    oldLegacy: Cookies.get('enableOldLegacy') === 'true',
    amg: Cookies.get('enableAMG') === 'true'
  }));

  // Use a ref to track the previous state
  const previousContentSources = useRef(contentSources);

  useEffect(() => {
    const checkCookies = () => {
      const newContentSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        oldLegacy: Cookies.get('enableOldLegacy') === 'true',
        amg: Cookies.get('enableAMG') === 'true'
      };

      // Only update if there are actual changes
      if (JSON.stringify(newContentSources) !== JSON.stringify(previousContentSources.current)) {
        previousContentSources.current = newContentSources;
        setContentSources(newContentSources);
      }
    };

    const interval = setInterval(checkCookies, 2000); // Check every 2 seconds instead of every second
    return () => clearInterval(interval);
  }, []); // Empty dependency array since we're using refs

  useEffect(() => {
    const fetchShips = () => {
      const cachedShips = localStorage.getItem('ships');
      const cachedLegacyShips = localStorage.getItem('legacyShips');
      const cachedLegendsShips = localStorage.getItem('legendsShips');
      const cachedOldLegacyShips = localStorage.getItem('oldLegacyShips');
      const cachedArcShips = localStorage.getItem('arcShips');
      const cachedAMGShips = localStorage.getItem('amgShips');
      let allShips: ShipModel[] = [];

      const processShips = (data: ShipData, prefix: string = '') => {
        if (data && data.ships) {
          return Object.entries(data.ships).flatMap(([chassisName, chassisData]: [string, ChassisData]) => 
            Object.values(chassisData.models || {}).map((model: ShipModel) => {
              const speedText = Object.entries(model.speed || {})
                .map(([speed, yaw]) => `speed ${speed} yaw ${yaw.join(' ')}`)
                .join(' ');
              const armamentText = Object.entries(model.armament || {}).map(([zone, dice]) => {
                const diceColors = ['red', 'blue', 'black'];
                return dice.map((count, index) => count > 0 ? `${zone} ${diceColors[index]} ${count}` : '').filter(Boolean);
              }).flat().join(' ');
              const upgradesText = model.upgrades?.join(' ') || '';

              return {
                ...model,
                id: prefix ? `${prefix}-${chassisName}-${model.name}` : `${chassisName}-${model.name}`,
                chassis: chassisName,
                size: chassisData.size,
                traits: model.traits || [],
                source: (prefix || 'regular') as ContentSource,
                searchableText: JSON.stringify({
                  ...model,
                  name: model.name.toLowerCase(),
                  speed: speedText,
                  armament: armamentText,
                  cardimage: sanitizeImageUrl(model.cardimage),
                  upgrades: upgradesText,
                  traits: model.traits?.map(trait => ` ${trait} `).join(' ') || '',
                  tokens: Object.entries(model.tokens || {})
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    .filter(([_, value]) => value > 0)
                    .reduce((acc, [key, value]) => ({ ...acc, [key.replace('def_', '')]: value }), {})
                }).toLowerCase()
              };
            })
          );
        }
        return [];
      };

      if (cachedShips) {
        const shipData = JSON.parse(cachedShips);
        allShips = [...allShips, ...processShips(shipData)];
      }

      if (cachedAMGShips) {
        const amgShipData = JSON.parse(cachedAMGShips);
        allShips = [...allShips, ...processShips(amgShipData, 'amg')];
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

      // Get errata keys from localStorage
      const errataKeys = JSON.parse(localStorage.getItem('errataKeys') || '{}');
      const shipErrataKeys = errataKeys.ships || [];
      // console.log('Retrieved errata keys:', shipErrataKeys);
      
      // Create a Map to group ships by their base name
      const shipGroups = new Map<string, ShipModel[]>();

      allShips.forEach(ship => {
        // Use chassis name for grouping since errata is chassis-based
        const baseName = ship.chassis
          .replace(/^(legacy|legends|oldLegacy|arc|amg)-/, '') // Remove source prefix
          .replace(/-errata(-[^-]+)?$/, ''); // Remove both types of errata suffixes
        
        // console.log(`Processing ship: ${ship.id}, baseName: ${baseName}`);
        
        if (!shipGroups.has(baseName)) {
          shipGroups.set(baseName, []);
        }
        shipGroups.get(baseName)?.push(ship);
      });

      // console.log('Grouped ships by base name:', Array.from(shipGroups.entries()));

      // Filter out non-errata versions when errata exists
      allShips = Array.from(shipGroups.values()).map(group => {
        // First, identify which ships in the group have errata versions
        const shipsWithErrataStatus = group.map(ship => {
          // Check if this ship's chassis matches any errata keys or has -errata suffix
          const hasErrata = shipErrataKeys.some((errataKey: string) => ship.chassis.includes(errataKey)) ||
                           ship.chassis.endsWith('-errata');
          return { ship, hasErrata };
        });

        // If any ship in this group has errata, process the replacements
        if (shipsWithErrataStatus.some(({ hasErrata }) => hasErrata)) {
          const processedShips = group.map(ship => {
            // First check for AMG errata version
            const amgErrata = group.find(candidate => 
              candidate.chassis === `${ship.chassis}-errata`
            );
            
            // Only apply AMG errata if the cookie is enabled
            const enableAMG = Cookies.get('enableAMG') === 'true';
            if (amgErrata && enableAMG) {
              console.log(`Replacing ${ship.id} with AMG errata version ${amgErrata.id}`);
              return amgErrata;
            }

            // Then check for source-prefixed version
            const sourceVersion = group.find(candidate => 
              candidate.id !== ship.id && 
              candidate.id.match(/^(legacy|legends|oldLegacy|arc)-/) &&
              ship.id === candidate.id.replace(/^(legacy|legends|oldLegacy|arc)-/, '')
            );

            if (sourceVersion) {
              // Check if the source version is enabled
              const source = sourceVersion.source;
              const isSourceEnabled = source ? contentSources[source as keyof typeof contentSources] : true;
              
              if (isSourceEnabled) {
                console.log(`Replacing ${ship.id} with source version ${sourceVersion.id}`);
                return sourceVersion;
              }
            }
            
            return ship;
          });

          // Remove duplicates and check content sources
          const uniqueShips = new Map();
          processedShips.forEach(ship => {
            const normalizedId = ship.id.replace(/^(legacy|legends|oldLegacy|arc|amg)-/, '');
            const isSourceEnabled = ship.source === 'regular' || contentSources[ship.source as keyof typeof contentSources];
            
            if (isSourceEnabled && (!uniqueShips.has(normalizedId) || ship.id.match(/^(legacy|legends|oldLegacy|arc|amg)-/))) {
              uniqueShips.set(normalizedId, ship);
            }
          });

          return Array.from(uniqueShips.values());
        }

        // If no errata exists, filter by enabled content sources
        return group.filter(ship => 
          ship.source === 'regular' || contentSources[ship.source as keyof typeof contentSources]
        );
      }).flat();

      const filteredShips = allShips.filter(ship => {
        // Exclude dummy ships
        if (ship.name.includes('Dummy')) return false;

        // For sandbox mode, include ships from all base factions and sandbox faction
        if (faction === 'sandbox') {
          const baseFactions = ['rebel', 'empire', 'republic', 'separatist', 'sandbox'];
          const allowedFactions = [...baseFactions];
          
          // Include scum faction if custom content is enabled
          if (contentSources.legends) {
            allowedFactions.push('scum');
          }
          
          return allowedFactions.includes(ship.faction);
        }
        
        // Normal faction filtering
        return ship.faction === faction;
      });

      // Sort ships: non-unique, unique, then huge
      const sortedShips = filteredShips.sort((a, b) => {
        if (a.size === 'huge' && b.size !== 'huge') return 1;
        if (a.size !== 'huge' && b.size === 'huge') return -1;
        if (a.unique && !b.unique) return 1;
        if (!a.unique && b.unique) return -1;
        return a.name.localeCompare(b.name);
      });

      setAllShips(sortedShips);
      setDisplayedShips(sortedShips);
    };

    fetchShips();
  }, [faction, filter.minPoints, filter.maxPoints, contentSources]);

  // Add useMemo for filtered and sorted ships
  const processedShips = useMemo(() => {
    let sortedShips = [...allShips];

    // Filter ships based on search query
    if (searchQuery) {
      sortedShips = sortedShips.filter(ship => {
        const searchLower = searchQuery.toLowerCase();
        return ship.searchableText.includes(searchLower);
      });
    }

    // Apply sorting
    sortedShips.sort((a, b) => {
      // Always keep huge ships at the end
      if (a.size === 'huge' && b.size !== 'huge') return 1;
      if (a.size !== 'huge' && b.size === 'huge') return -1;

      // If no active sorts, use default sorting
      if (Object.values(activeSorts).every(sort => sort === null)) {
        if (a.unique && !b.unique) return 1;
        if (!a.unique && b.unique) return -1;
        return a.name.localeCompare(b.name);
      }

      // Apply active sorts in priority order
      for (const option of ['custom', 'unique', 'points', 'alphabetical'] as SortOption[]) {
        if (activeSorts[option] !== null) {
          let result = 0;
          
          switch (option) {
            case 'custom':
              if (a.source === b.source) result = 0;
              else if (a.source !== 'regular' && b.source === 'regular') result = -1;
              else if (a.source === 'regular' && b.source !== 'regular') result = 1;
              break;
            case 'unique':
              result = (a.unique === b.unique ? 0 : a.unique ? -1 : 1);
              break;
            case 'points':
              result = a.points - b.points;
              break;
            case 'alphabetical':
              result = a.name.localeCompare(b.name);
              break;
          }

          if (result !== 0) {
            return activeSorts[option] === 'asc' ? result : -result;
          }
        }
      }
      return 0;
    });

    return sortedShips;
  }, [allShips, activeSorts, searchQuery]);

  // Update the useEffect to use the memoized value
  useEffect(() => {
    setDisplayedShips(processedShips);
  }, [processedShips]);

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
                      className="object-cover object-center scale-[101%]"
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
