import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from '@/components/OptimizedImage';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Cookies from 'js-cookie';
import { ContentSource } from './FleetBuilder';
import { sanitizeImageUrl } from '@/utils/dataFetcher';
import { GamemodeRestrictions } from '@/utils/gamemodeRestrictions';

export interface ShipModel {
  id: string;
  name: string;
  points: number;
  cardimage: string;
  faction: string;
  upgrades?: string[];
  unique: boolean;
  chassis: string;
  size: "small" | "medium" | "large" | "huge" | "280-huge";
  traits?: string[];
  source: ContentSource;
  speed: Record<string, number[]>;
  tokens: Record<string, number>;
  armament: Record<string, number[]>;
  searchableText: string;
  shipClass?: string;
}

interface ShipData {
  ships: Record<string, ChassisData>;
}

interface ChassisData {
  models: Record<string, ShipModel>;
  size: "small" | "medium" | "large" | "huge" | "280-huge";
}

interface ShipSelectorProps {
  faction: string;
  filter: { minPoints: number; maxPoints: number };
  onSelectShip: (ship: ShipModel) => void;
  onClose: () => void;
  gamemodeRestrictions?: GamemodeRestrictions;
  selectedShips?: ShipModel[];
}

export function ShipSelector({ faction, filter, onSelectShip, onClose, gamemodeRestrictions, selectedShips = [] }: ShipSelectorProps) {
  const [allShips, setAllShips] = useState<ShipModel[]>([]);
  const [useTextOnly, setUseTextOnly] = useState(false);
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
  const [expandedShips, setExpandedShips] = useState<Set<string>>(new Set());
  const contentSourcesEnabled = useMemo(() => {
    return {
      arc: Cookies.get('enableArc') === 'true',
      legacy: Cookies.get('enableLegacy') === 'true',
      legends: Cookies.get('enableLegends') === 'true',
      legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
      arcBeta: Cookies.get('enableArcBeta') === 'true',
      amg: Cookies.get('enableAMG') === 'true',
      nexus: Cookies.get('enableNexus') === 'true',
      naboo: Cookies.get('enableNaboo') === 'true'
    };
  }, []);

  useEffect(() => {
    const textOnlyCookie = Cookies.get('useTextOnlyMode');
    setUseTextOnly(textOnlyCookie === 'true');
  }, []); 

  // Poll for text-only mode cookie changes and update state
  useEffect(() => {
    let prevTextOnly = Cookies.get('useTextOnlyMode');
    const interval = setInterval(() => {
      const currentTextOnly = Cookies.get('useTextOnlyMode');
      if (currentTextOnly !== prevTextOnly) {
        setUseTextOnly(currentTextOnly === 'true');
        prevTextOnly = currentTextOnly;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [, setLoadingState] = useState(() => {
    return {
      arc: Cookies.get('enableArc') === 'true',
      legacy: Cookies.get('enableLegacy') === 'true',
      legends: Cookies.get('enableLegends') === 'true',
      legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
      arcBeta: Cookies.get('enableArcBeta') === 'true',
      amg: Cookies.get('enableAMG') === 'true',
      nexus: Cookies.get('enableNexus') === 'true',
      naboo: Cookies.get('enableNaboo') === 'true'
    };
  });

  // Use a ref to track the previous state
  const previousContentSources = useRef(contentSourcesEnabled);

  useEffect(() => {
    const checkCookies = () => {
      const newContentSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
        arcBeta: Cookies.get('enableArcBeta') === 'true',
        amg: Cookies.get('enableAMG') === 'true',
        nexus: Cookies.get('enableNexus') === 'true',
        naboo: Cookies.get('enableNaboo') === 'true'
      };

      // Only update if there are actual changes
      if (JSON.stringify(newContentSources) !== JSON.stringify(previousContentSources.current)) {
        previousContentSources.current = newContentSources;
        setLoadingState(newContentSources);
      }
    };

    const interval = setInterval(checkCookies, 2000); // Check every 2 seconds instead of every second
    return () => clearInterval(interval);
  }, []); // Empty dependency array since we're using refs

  useEffect(() => {
    const fetchShips = async () => {
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

      // Load cached data
      const cachedShips = localStorage.getItem('ships');
      const cachedLegacyShips = localStorage.getItem('legacyShips');
      const cachedLegendsShips = localStorage.getItem('legendsShips');
      const cachedNexusShips = localStorage.getItem('nexusShips');
      const cachedLegacyBetaShips = localStorage.getItem('legacyBetaShips');
      const cachedArcShips = localStorage.getItem('arcShips');
      const cachedArcBetaShips = localStorage.getItem('arcBetaShips');
      const cachedNabooShips = localStorage.getItem('nabooShips');

      // Process regular ships
      if (cachedShips) {
        const shipData = JSON.parse(cachedShips);
        allShips = processShips(shipData, 'regular');
      }

      // Process legacy ships
      if (cachedLegacyShips) {
        const legacyShipData = JSON.parse(cachedLegacyShips);
        allShips = [...allShips, ...processShips(legacyShipData, 'legacy')];
      }

      // Process legends ships
      if (cachedLegendsShips) {
        const legendsShipData = JSON.parse(cachedLegendsShips);
        allShips = [...allShips, ...processShips(legendsShipData, 'legends')];
      }

      // Process nexus ships
      if (cachedNexusShips) {
        const nexusShipData = JSON.parse(cachedNexusShips);
        allShips = [...allShips, ...processShips(nexusShipData, 'nexus')];
      }

      // Process legacy beta ships
      if (cachedLegacyBetaShips) {
        const legacyBetaShipData = JSON.parse(cachedLegacyBetaShips);
        allShips = [...allShips, ...processShips(legacyBetaShipData, 'legacyBeta')];
      }

      // Process arc ships
      if (cachedArcShips) {
        const arcShipData = JSON.parse(cachedArcShips);
        allShips = [...allShips, ...processShips(arcShipData, 'arc')];
      }

      // Process arc beta ships
      if (cachedArcBetaShips) {
        const arcBetaShipData = JSON.parse(cachedArcBetaShips);
        allShips = [...allShips, ...processShips(arcBetaShipData, 'arcBeta')];
      }

      // Process naboo ships
      if (cachedNabooShips) {
        const nabooShipData = JSON.parse(cachedNabooShips);
        allShips = [...allShips, ...processShips(nabooShipData, 'naboo')];
      }

      // Get errata keys from localStorage
      const errataKeys = JSON.parse(localStorage.getItem('errataKeys') || '{}');
      const shipModelErrataKeys = errataKeys.shipmodels || [];
      
      // Create a Map to group ships by their chassis
      const shipGroups = new Map<string, ShipModel[]>();

      allShips.forEach(ship => {
        // Group by chassis name
        const chassisName = ship.chassis;
        
        if (!shipGroups.has(chassisName)) {
          shipGroups.set(chassisName, []);
        }
        shipGroups.get(chassisName)?.push(ship);
      });



      // Filter out non-errata versions when errata exists within each chassis
      allShips = Array.from(shipGroups.values()).map(group => {
        
        // Helper function to convert ship name to errata key format
        const toErrataKeyFormat = (name: string) => {
          return name.toLowerCase().replace(/\s+/g, '-').replace(/[{}]/g, '');
        };

        // First pass: identify ships that have errata versions available
        const shipsToKeep: ShipModel[] = [];
        const processedShips = new Set<string>();
        
        group.forEach(ship => {
          if (processedShips.has(ship.id)) return;
          
          // Convert ship name to errata key format to check against the keys
          const shipKeyFormat = toErrataKeyFormat(ship.name);
          const expectedErrataKeyArc = `${shipKeyFormat}-errata-arc`;
          const expectedErrataKey = `${shipKeyFormat}-errata`;
          
          // Check if this ship has an errata version in the keys
          const hasErrataInKeys = shipModelErrataKeys.includes(expectedErrataKeyArc) || shipModelErrataKeys.includes(expectedErrataKey);
          
          if (hasErrataInKeys) {
            // This ship has an errata version - find all versions with the same name in this chassis
            const sameNameShips = group.filter(otherShip => otherShip.name === ship.name);
            
            if (sameNameShips.length > 1) {
              // Multiple ships with same name - determine which is the errata version
              
              // Priority order for errata versions: arc > other sources > regular
              const arcVersion = sameNameShips.find(s => s.source === 'arc' || s.id.startsWith('arc-'));
              const otherSourceVersion = sameNameShips.find(s => s.source !== 'regular' && s.source !== 'arc' && !s.id.startsWith('regular-') && !s.id.startsWith('arc-'));
              const regularVersion = sameNameShips.find(s => s.source === 'regular' || s.id.startsWith('regular-'));
              
              let selectedVersion = null;
              
              if (arcVersion && shipModelErrataKeys.includes(expectedErrataKeyArc)) {
                selectedVersion = arcVersion;
              } else if (otherSourceVersion && shipModelErrataKeys.includes(expectedErrataKey)) {
                selectedVersion = otherSourceVersion;
              } else if (regularVersion) {
                selectedVersion = regularVersion;
              }
              
              if (selectedVersion) {
                shipsToKeep.push(selectedVersion);
                // Mark all versions of this ship as processed
                sameNameShips.forEach(s => {
                  processedShips.add(s.id);
                });
              }
            } else {
              // Only one ship with this name - keep it
              shipsToKeep.push(ship);
              processedShips.add(ship.id);
            }
          } else {
            // This ship has no errata version - keep it
            shipsToKeep.push(ship);
            processedShips.add(ship.id);
          }
        });

        // Filter by enabled content sources
        return shipsToKeep.filter(ship => 
          ship.source === 'regular' || contentSourcesEnabled[ship.source as keyof typeof contentSourcesEnabled]
        );
      }).flat();

      const filteredShips = allShips.filter(ship => {
        // Exclude dummy ships
        if (ship.name.includes('Dummy')) return false;

        // For sandbox mode, include ships from all base factions and sandbox faction
        if (faction === 'sandbox') {
          const baseFactions = ['rebel', 'empire', 'republic', 'separatist', 'sandbox'];
          const allowedFactions = [...baseFactions];
          
          // Include nexus factions if nexus content is enabled
          if (contentSourcesEnabled.nexus) {
            allowedFactions.push('scum');
            allowedFactions.push('new-republic');
            allowedFactions.push('first-order');
            allowedFactions.push('resistance');
          }
          
          return allowedFactions.includes(ship.faction);
        }
        
        // Normal faction filtering
        return ship.faction === faction;
      });

      // Sort ships: non-unique, unique, then huge
      const sortedShips = filteredShips.sort((a, b) => {
        // Put both huge and 280-huge ships at the end
        if ((a.size === 'huge' || a.size === '280-huge') && (b.size !== 'huge' && b.size !== '280-huge')) return 1;
        if ((a.size !== 'huge' && a.size !== '280-huge') && (b.size === 'huge' || b.size === '280-huge')) return -1;
        if (a.unique && !b.unique) return 1;
        if (!a.unique && b.unique) return -1;
        return a.name.localeCompare(b.name);
      });

      setAllShips(sortedShips);
    };

    fetchShips();
  }, [faction, filter.minPoints, filter.maxPoints, contentSourcesEnabled]);

  const isShipAllowed = (ship: ShipModel) => {
    if (!gamemodeRestrictions) return true;

    // Check ship size restrictions
    if (gamemodeRestrictions.allowedShipSizes && !gamemodeRestrictions.allowedShipSizes.includes(ship.size)) {
      return false;
    }
    if (gamemodeRestrictions.disallowedShipSizes && gamemodeRestrictions.disallowedShipSizes.includes(ship.size)) {
      return false;
    }

    // Check ship size limits
    if (gamemodeRestrictions.shipSizeLimits) {
      const sizeLimit = gamemodeRestrictions.shipSizeLimits[ship.size];
      if (sizeLimit !== undefined) {
        const currentSizeCount = selectedShips.filter(selectedShip => selectedShip.size === ship.size).length;
        if (currentSizeCount >= sizeLimit) {
          return false;
        }
      }
    }

    // Check ship class restrictions
    if (gamemodeRestrictions.allowedShipClasses && ship.shipClass && !gamemodeRestrictions.allowedShipClasses.includes(ship.shipClass)) {
      return false;
    }
    if (gamemodeRestrictions.disallowedShipClasses && ship.shipClass && gamemodeRestrictions.disallowedShipClasses.includes(ship.shipClass)) {
      return false;
    }

    return true;
  };

  // Update the useMemo for filtered and sorted ships
  const processedShips = useMemo(() => {
    let sortedShips = [...allShips];

    // Filter ships based on search query
    if (searchQuery) {
      sortedShips = sortedShips.filter(ship => {
        const searchLower = searchQuery.toLowerCase();
        return ship.searchableText.includes(searchLower);
      });
    }

    // Define sort functions
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

    // Apply sorting
    sortedShips.sort((a, b) => {
      // Always keep huge ships at the end
      if ((a.size === 'huge' || a.size === '280-huge') && (b.size !== 'huge' && b.size !== '280-huge')) return 1;
      if ((a.size !== 'huge' && a.size !== '280-huge') && (b.size === 'huge' || b.size === '280-huge')) return -1;

      // If no active sorts, use default sorting (non-unique first, then unique)
      if (Object.values(activeSorts).every(sort => sort === null)) {
        if (a.unique && !b.unique) return 1;
        if (!a.unique && b.unique) return -1;
        return a.name.localeCompare(b.name);
      }

      // Apply active sorts in priority order
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

    return sortedShips;
  }, [allShips, activeSorts, searchQuery]);

  // The processedShips are used directly in the render instead of displayedShips

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

  // New comprehensive function to get all restriction messages
  const getShipRestrictionMessages = (ship: ShipModel): string[] => {
    const messages: string[] = [];

    // Check gamemode restrictions first
    if (gamemodeRestrictions) {
      // Check ship size restrictions
      if (gamemodeRestrictions.allowedShipSizes && !gamemodeRestrictions.allowedShipSizes.includes(ship.size)) {
        messages.push("Ship size not allowed in this gamemode");
      }
      if (gamemodeRestrictions.disallowedShipSizes && gamemodeRestrictions.disallowedShipSizes.includes(ship.size)) {
        messages.push("Ship size not allowed in this gamemode");
      }

      // Check ship size limits
      if (gamemodeRestrictions.shipSizeLimits && gamemodeRestrictions.shipSizeLimits[ship.size] !== undefined) {
        const currentSizeCount = selectedShips.filter(selectedShip => selectedShip.size === ship.size).length;
        if (currentSizeCount >= gamemodeRestrictions.shipSizeLimits[ship.size]!) {
          messages.push(`${ship.size.charAt(0).toUpperCase() + ship.size.slice(1)} ship limit reached (${gamemodeRestrictions.shipSizeLimits[ship.size]})`);
        }
      }

      // Check ship class restrictions
      if (gamemodeRestrictions.allowedShipClasses && ship.shipClass && !gamemodeRestrictions.allowedShipClasses.includes(ship.shipClass)) {
        messages.push(`Ship class "${ship.shipClass}" not allowed in this gamemode`);
      }
      if (gamemodeRestrictions.disallowedShipClasses && ship.shipClass && gamemodeRestrictions.disallowedShipClasses.includes(ship.shipClass)) {
        messages.push(`Ship class "${ship.shipClass}" not allowed in this gamemode`);
      }
    }

    // Check non-gamemode restrictions
    if (ship.unique && uniqueClassNames.includes(ship.name)) {
      messages.push("Unique ship already in fleet");
    }

    return messages;
  };

  const handleShipClick = (ship: ShipModel) => {
    if (isShipAvailable(ship) && isShipAllowed(ship)) {
      onSelectShip(ship);
      if (ship.unique) {
        addUniqueClassName(ship.name);
      }
    }
  };

  const isHugeShip = (ship: ShipModel) => ship.size === 'huge' || ship.size === '280-huge';

  // Helper function to generate ship size limit messages
  const getShipSizeLimitMessages = () => {
    if (!gamemodeRestrictions?.shipSizeLimits) return [];
    
    const messages: string[] = [];
    const sizeCounts: Record<string, number> = {};
    
    // Count current ships by size
    selectedShips.forEach(ship => {
      sizeCounts[ship.size] = (sizeCounts[ship.size] || 0) + 1;
    });
    
    // Check each size limit
    Object.entries(gamemodeRestrictions.shipSizeLimits).forEach(([size, limit]) => {
      const currentCount = sizeCounts[size] || 0;
      if (currentCount >= limit) {
        messages.push(`${size.charAt(0).toUpperCase() + size.slice(1)} ship limit reached: ${currentCount}/${limit}`);
      }
    });
    
    return messages;
  };

  const toggleShipDetails = (shipId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedShips(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shipId)) {
        newSet.delete(shipId);
      } else {
        newSet.add(shipId);
      }
      return newSet;
    });
  };

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
          {getShipSizeLimitMessages().map((message, index) => (
            <div key={index} className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-center font-semibold">
              {message}
            </div>
          ))}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
            {processedShips.map((ship) => (
              <div key={ship.id} className={`w-full ${isHugeShip(ship) ? 'col-span-2' : ''}`}>
                {useTextOnly ? (
                  /* Text-only mode display */
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[200px]"
                       onClick={() => handleShipClick(ship)}
                       style={{ opacity: (!isShipAvailable(ship) || !isShipAllowed(ship)) ? 0.5 : 1 }}>
                    <div className="space-y-2 text-xs">
                      {/* Ship name and points */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {ship.unique && <span className="mr-1 text-yellow-500">●</span>}
                          <span className="font-bold text-sm leading-tight">{ship.name}</span>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">{ship.points}pt</span>
                      </div>

                      {/* Size and traits */}
                      <div>
                        <strong className="text-blue-600 dark:text-blue-400">Size:</strong> {ship.size.charAt(0).toUpperCase() + ship.size.slice(1)}
                        {ship.traits && ship.traits.length > 0 && (
                          <>
                            {' | '}
                            <strong className="text-blue-600 dark:text-blue-400">Traits:</strong> {ship.traits.map(trait => trait.charAt(0).toUpperCase() + trait.slice(1)).join(', ')}
                          </>
                        )}
                      </div>

                      {/* Stats */}
                      <div>
                        <strong className="text-green-600 dark:text-green-400">Stats:</strong>
                        <div className="ml-1 text-xs">
                          Command: {ship.tokens?.command || 0} | Squadron: {ship.tokens?.squadron || 0} | Engineering: {ship.tokens?.engineering || 0} | Hull: {ship.tokens?.hull || 0}
                        </div>
                      </div>

                      {/* Speed */}
                      {ship.speed && (
                        <div>
                          <strong className="text-cyan-600 dark:text-cyan-400">Speed:</strong>
                          <div className="ml-1 text-xs">
                            {Object.entries(ship.speed).map(([click, speeds]) => (
                              <span key={click}>Click {click}: {speeds.join('-')} </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hull zones and armament */}
                      {ship.armament && (
                        <div>
                          <strong className="text-orange-600 dark:text-orange-400">Hull Zones:</strong>
                          <div className="ml-1 text-xs space-y-1">
                            {Object.entries(ship.armament)
                              .filter(([zone, dice]) => {
                                const standardZones = ['asa', 'front', 'rear', 'left', 'right'];
                                const isStandardZone = standardZones.includes(zone.toLowerCase());
                                const hasDice = dice.some(count => count > 0);
                                return isStandardZone || hasDice;
                              })
                              .map(([zone, dice]) => (
                                <div key={zone} className="flex justify-between">
                                  <span className="capitalize">{zone}:</span>
                                  <span>
                                    {dice.map((count, i) => {
                                      const colors = ['Red', 'Blue', 'Black'];
                                      return count > 0 ? `${count}${colors[i]}` : '';
                                    }).filter(Boolean).join(' ') || 'None'}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* Upgrade suite */}
                      {ship.upgrades && ship.upgrades.length > 0 && (
                        <div>
                          <strong className="text-indigo-600 dark:text-indigo-400">Upgrade Suite:</strong>
                          <div className="ml-1 text-xs">
                            {ship.upgrades.map(upgrade => upgrade.charAt(0).toUpperCase() + upgrade.slice(1).replace('-', ' ')).join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Restriction messages if not available */}
                      {(!isShipAvailable(ship) || !isShipAllowed(ship)) && (
                        <div className="border-t pt-2 mt-2">
                          <strong className="text-red-600 dark:text-red-400 text-xs">Unavailable:</strong>
                          <div className="ml-1 text-xs text-red-600 dark:text-red-400">
                            {(() => {
                              const messages = getShipRestrictionMessages(ship);
                              if (messages.length === 0) {
                                return "Ship not available";
                              }
                              return messages.join(' • ');
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Regular image mode display */
                  <>
                    <div className={`${isHugeShip(ship) ? 'aspect-[5/4]' : 'aspect-[8.75/15]'}`}>
                      <Button
                        onClick={() => handleShipClick(ship)}
                        className={`p-0 overflow-visible relative w-full h-full rounded-lg bg-transparent ${
                          !isShipAvailable(ship) || !isShipAllowed(ship) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={!isShipAvailable(ship) || !isShipAllowed(ship)}
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
                          {(!isShipAvailable(ship) || !isShipAllowed(ship)) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 p-2">
                              <div className="text-white text-xs text-center leading-tight w-full px-1">
                                <span className="break-words block" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                                {(() => {
                                  const messages = getShipRestrictionMessages(ship);
                                  if (messages.length === 0) {
                                    return "Ship not available";
                                  }
                                  return messages.join(' • ');
                                })()}
                                </span>
                              </div>
                            </div>
                          )}
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
                      {/* Details toggle button */}
                      <Button
                        onClick={(e) => toggleShipDetails(ship.id, e)}
                        className="absolute top-1 right-1 z-10 w-6 h-6 p-0 bg-black/50 hover:bg-black/70"
                        size="sm"
                      >
                        {expandedShips.has(ship.id) ? 
                          <ChevronUp className="w-3 h-3 text-white" /> : 
                          <ChevronDown className="w-3 h-3 text-white" />
                        }
                      </Button>
                    </div>
                    {/* Expandable details section */}
                    {expandedShips.has(ship.id) && (
                      <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                        <div className="space-y-2">
                          <div>
                            <strong>Size:</strong> {ship.size}
                          </div>
                          {ship.traits && ship.traits.length > 0 && (
                            <div>
                              <strong>Traits:</strong> {ship.traits.map(trait => trait.charAt(0).toUpperCase() + trait.slice(1)).join(', ')}
                            </div>
                          )}
                          <div>
                            <strong>Stats:</strong>
                            <div className="ml-2">
                              Command: {ship.tokens?.command || 0} | 
                              Squadron: {ship.tokens?.squadron || 0} | 
                              Engineering: {ship.tokens?.engineering || 0} | 
                              Hull: {ship.tokens?.hull || 0}
                            </div>
                          </div>
                          {ship.speed && (
                            <div>
                              <strong>Speed:</strong>
                              <div className="ml-2">
                                {Object.entries(ship.speed).map(([click, speeds]) => (
                                  <div key={click}>Click {click}: {speeds.join('-')}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {ship.armament && (
                            <div>
                              <strong>Armament:</strong>
                              <div className="ml-2">
                                {Object.entries(ship.armament).map(([zone, dice]) => (
                                  <div key={zone}>
                                    {zone}: {dice.map((count, i) => {
                                      const colors = ['Red', 'Blue', 'Black'];
                                      return count > 0 ? `${count}${colors[i]}` : '';
                                    }).filter(Boolean).join(' ')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {ship.upgrades && ship.upgrades.length > 0 && (
                            <div>
                              <strong>Upgrade Suite:</strong> {ship.upgrades.map(upgrade => upgrade.charAt(0).toUpperCase() + upgrade.slice(1).replace('-', ' ')).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
