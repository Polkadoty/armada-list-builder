import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from './OptimizedImage';
import { ContentSource } from './FleetBuilder';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { SortToggleGroup } from './SortToggleGroup';
import Cookies from 'js-cookie';
import { sanitizeImageUrl } from '@/utils/dataFetcher';
import { GamemodeRestrictions } from '@/utils/gamemodeRestrictions';

export interface ObjectiveModel {
  id: string;
  name: string;
  type: string;
  cardimage: string;
  source: ContentSource;
}

interface ObjectiveSelectorProps {
  type: 'assault' | 'defense' | 'navigation' | 'campaign' | 'skirmish';
  onSelectObjective: (objective: ObjectiveModel) => void;
  onClose: () => void;
  gamemodeRestrictions?: GamemodeRestrictions;
  forcedObjectiveName?: string;
  selectedObjectives?: ObjectiveModel[]; // Array of already selected objectives to grey out
}

type SortOption = 'alphabetical' | 'points' | 'unique' | 'custom';

export function ObjectiveSelector({ type, onSelectObjective, onClose, gamemodeRestrictions, forcedObjectiveName, selectedObjectives = [] }: ObjectiveSelectorProps) {
  const [objectives, setObjectives] = useState<ObjectiveModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeSorts, setActiveSorts] = useState<Record<SortOption, 'asc' | 'desc' | null>>(() => {
    const savedSorts = Cookies.get(`sortState_objectives`);
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

  const contentSourcesEnabled = useMemo(() => {
    return {
      arc: Cookies.get('enableArc') === 'true',
      legacy: Cookies.get('enableLegacy') === 'true',
      legends: Cookies.get('enableLegends') === 'true',
      legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
      amg: Cookies.get('enableAMG') === 'true',
      nexus: Cookies.get('enableNexus') === 'true',
      naboo: Cookies.get('enableNaboo') === 'true'
    };
  }, []);

  const [loadingState, setLoadingState] = useState(() => {
    return {
      arc: Cookies.get('enableArc') === 'true',
      legacy: Cookies.get('enableLegacy') === 'true',
      legends: Cookies.get('enableLegends') === 'true',
      legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
      amg: Cookies.get('enableAMG') === 'true',
      nexus: Cookies.get('enableNexus') === 'true',
      naboo: Cookies.get('enableNaboo') === 'true'
    };
  });

  // Check for cookie changes
  useEffect(() => {
    const checkCookies = () => {
      const newContentSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
        amg: Cookies.get('enableAMG') === 'true',
        nexus: Cookies.get('enableNexus') === 'true',
        naboo: Cookies.get('enableNaboo') === 'true'
      };

      // Check if any values have changed
      if (JSON.stringify(newContentSources) !== JSON.stringify(loadingState)) {
        setLoadingState(newContentSources);
      }
    };

    // Check immediately and set up interval
    checkCookies();
    const interval = setInterval(checkCookies, 1000);

    return () => clearInterval(interval);
  }, [loadingState]);

  // Modified useEffect to depend on contentSources
  useEffect(() => {
    const fetchObjectives = () => {
      setLoading(true);
      try {
        const objectiveMap = new Map<string, ObjectiveModel>();
        
        // Get errata keys for objectives
        const errataKeysJson = localStorage.getItem('errataKeys');
        const errataKeys = errataKeysJson ? JSON.parse(errataKeysJson).objectives : [];
        
        // Get all localStorage keys
        const storageKeys = Object.keys(localStorage);
        
        // Filter keys that contain 'objectives' or 'Objectives'
        const objectiveKeys = storageKeys.filter(key => 
          key.toLowerCase().includes('objectives')
        );

        // Process objectives based on enabled content sources
        objectiveKeys.forEach(storageKey => {
          try {
            const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const objectivesData = data.objectives || {};
            const source = storageKey.replace(/objectives|Objectives/g, '').toLowerCase() || 'regular';

            // Skip if this content source is disabled (except for regular content)
            if (source !== 'regular' && !contentSourcesEnabled[source as keyof typeof contentSourcesEnabled]) {
              return;
            }

            /* eslint-disable @typescript-eslint/no-explicit-any */
            Object.entries(objectivesData).forEach(([objectiveId, objective]: [string, any]) => {
              // For campaign type, include all objective types including actual campaign objectives; otherwise filter by specific type
              const shouldInclude = type === 'campaign' 
                ? ['campaign'].includes(objective.type)
                : type === 'skirmish'
                ? ['skirmish'].includes(objective.type)
                : objective.type === type;
                
              if (shouldInclude && !objectiveId.includes('-errata-')) {
                objectiveMap.set(objectiveId, {
                  id: objectiveId,
                  name: objective.name,
                  type: objective.type,
                  cardimage: validateImageUrl(objective.cardimage),
                  source: source as ContentSource
                });
              }
            });
          } catch (error) {
            console.error(`Error processing ${storageKey}:`, error);
          }
        });

        // Then, process and add errata objectives
        objectiveKeys.forEach(storageKey => {
          try {
            const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const objectivesData = data.objectives || {};
            const source = storageKey.replace(/objectives|Objectives/g, '').toLowerCase() || 'regular';

            // Skip if this content source is disabled (except for regular content)
            if (source !== 'regular' && !contentSourcesEnabled[source as keyof typeof contentSourcesEnabled]) {
              return;
            }

            /* eslint-disable @typescript-eslint/no-explicit-any */
            Object.entries(objectivesData).forEach(([objectiveId, objective]: [string, any]) => {
              // For campaign type, include all objective types including actual campaign objectives; otherwise filter by specific type
              const shouldInclude = type === 'campaign' 
                ? ['assault', 'defense', 'navigation', 'campaign'].includes(objective.type)
                : type === 'skirmish'
                ? ['skirmish'].includes(objective.type)
                : objective.type === type;
                
              if (shouldInclude && objectiveId.includes('-errata-')) {
                const baseId = objectiveId.replace(/-errata-(legacy|legends|legacyBeta|arc)$/, '');
                
                if (errataKeys.includes(objectiveId)) {
                  objectiveMap.set(baseId, {
                    id: objectiveId,
                    name: objective.name,
                    type: objective.type,
                    cardimage: sanitizeImageUrl(objective.cardimage),
                    source: source as ContentSource
                  });
                }
              }
            });
          } catch (error) {
            console.error(`Error processing ${storageKey}:`, error);
          }
        });

        setObjectives(Array.from(objectiveMap.values()));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching objectives:', error);
      }
    };

    fetchObjectives();
  }, [type, contentSourcesEnabled]);

  // Function to check if an objective is allowed
  const isObjectiveAllowed = (objective: ObjectiveModel) => {
    if (!gamemodeRestrictions?.objectiveRestrictions) return true;

    const restrictions = gamemodeRestrictions.objectiveRestrictions;
    
    // Check allowed objectives
    if (restrictions.allowedObjectives) {
      const allowedForType = restrictions.allowedObjectives[type as keyof typeof restrictions.allowedObjectives];
      if (allowedForType && !allowedForType.includes(objective.name)) {
        return false;
      }
    }

    // Check disallowed objectives
    if (restrictions.disallowedObjectives) {
      const disallowedForType = restrictions.disallowedObjectives[type as keyof typeof restrictions.disallowedObjectives];
      if (disallowedForType && disallowedForType.includes(objective.name)) {
        return false;
      }
    }

    return true;
  };

  // Function to check if an objective is already selected
  const isObjectiveAlreadySelected = (objective: ObjectiveModel) => {
    return selectedObjectives.some(selected => selected.name === objective.name);
  };

  // Add useMemo for filtered and sorted objectives
  const processedObjectives = useMemo(() => {
    let filtered = objectives;
    
    // Apply search filter if needed
    if (searchQuery) {
      filtered = filtered.filter(objective =>
        objective.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // If no active sorts, use default sorting
      if (Object.values(activeSorts).every(sort => sort === null)) {
        return a.name.localeCompare(b.name);
      }

      // Apply active sorts in priority order
      for (const option of ['custom', 'alphabetical'] as SortOption[]) {
        if (activeSorts[option] !== null) {
          let result = 0;
          
          switch (option) {
            case 'custom':
              if (a.source === b.source) result = 0;
              else if (a.source !== 'regular' && b.source === 'regular') result = -1;
              else if (a.source === 'regular' && b.source !== 'regular') result = 1;
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

    return filtered;
  }, [objectives, activeSorts, searchQuery]);

  const handleSortToggle = (option: SortOption) => {
    setActiveSorts(prevSorts => {
      const newSorts = {
        ...prevSorts,
        [option]: prevSorts[option] === null ? 'asc' : prevSorts[option] === 'asc' ? 'desc' : null
      };
      Cookies.set(`sortState_objectives`, JSON.stringify(newSorts), { expires: 365 });
      return newSorts;
    });
  };

  const validateImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://api.swarmada.wiki${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30">
      <Card className="w-full h-full sm:w-[95%] sm:h-[90%] lg:w-[85%] lg:h-[85%] flex flex-col">
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          {showSearch ? (
            <div className="flex-grow mr-2 relative">
              <Input
                type="text"
                placeholder="Search objectives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10"
                autoFocus
              />
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setShowSearch(true)} className="flex items-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mr-2">{type.charAt(0).toUpperCase() + type.slice(1)}</h2>
              <Search size={20} />
            </Button>
          )}
          <div className="flex items-center">
            {showSearch && (
              <Button variant="ghost" onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="mr-2">
                <X size={20} />
              </Button>
            )}
            <SortToggleGroup activeSorts={activeSorts} onToggle={handleSortToggle} selectorType="objectives" />
            <Button variant="ghost" onClick={onClose} className="p-1 ml-2">
              <X size={20} />
            </Button>
          </div>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          {loading ? (
            <p>Loading objectives...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2">
              {processedObjectives.map((objective) => {
                const isMatchingForced = !forcedObjectiveName || objective.name === forcedObjectiveName;
                const isDisabled = forcedObjectiveName && !isMatchingForced;
                const isAllowed = isObjectiveAllowed(objective);
                const isAlreadySelected = isObjectiveAlreadySelected(objective);
                
                return (
                  <div key={objective.id} className="w-full aspect-[2.5/3.5]">
                    <Button
                      onClick={() => !isDisabled && isAllowed && !isAlreadySelected && onSelectObjective(objective)}
                      className={`p-0 overflow-hidden relative w-full h-full rounded-lg bg-transparent ${
                        isDisabled || !isAllowed || isAlreadySelected ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      disabled={!!isDisabled || !isAllowed || isAlreadySelected}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <OptimizedImage
                          src={objective.cardimage}
                          alt={objective.name}
                          width={250}
                          height={350}
                          className="object-cover object-center scale-[101%]"
                          onError={() => {}}
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2 visually-hidden">
                        <p className="text-xs sm:text-sm font-bold flex items-center justify-center">
                          <span className="break-words line-clamp-2 text-center">{objective.name}</span>
                        </p>
                      </div>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}