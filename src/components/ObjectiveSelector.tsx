import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from './OptimizedImage';
import { ContentSource } from './FleetBuilder';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { SortToggleGroup } from './SortToggleGroup';
import Cookies from 'js-cookie';

export interface ObjectiveModel {
  id: string;
  name: string;
  type: string;
  cardimage: string;
  source: ContentSource;
}

interface ObjectiveSelectorProps {
  type: 'assault' | 'defense' | 'navigation';
  onSelectObjective: (objective: ObjectiveModel) => void;
  onClose: () => void;
}

type SortOption = 'alphabetical' | 'points' | 'unique' | 'custom';

export function ObjectiveSelector({ type, onSelectObjective, onClose }: ObjectiveSelectorProps) {
  const [objectives, setObjectives] = useState<ObjectiveModel[]>([]);
  const [displayedObjectives, setDisplayedObjectives] = useState<ObjectiveModel[]>([]);
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

  // Add state to track content source enablement
  const [contentSources, setContentSources] = useState({
    arc: Cookies.get('enableArc') === 'true',
    legacy: Cookies.get('enableLegacy') === 'true',
    legends: Cookies.get('enableLegends') === 'true',
    oldLegacy: Cookies.get('enableOldLegacy') === 'true'
  });

  // Check for cookie changes
  useEffect(() => {
    const checkCookies = () => {
      const newContentSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        oldLegacy: Cookies.get('enableOldLegacy') === 'true'
      };

      // Check if any values have changed
      if (JSON.stringify(newContentSources) !== JSON.stringify(contentSources)) {
        setContentSources(newContentSources);
      }
    };

    // Check immediately and set up interval
    checkCookies();
    const interval = setInterval(checkCookies, 1000);

    return () => clearInterval(interval);
  }, [contentSources]);

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
            if (source !== 'regular' && !contentSources[source as keyof typeof contentSources]) {
              return;
            }

            /* eslint-disable @typescript-eslint/no-explicit-any */
            Object.entries(objectivesData).forEach(([objectiveId, objective]: [string, any]) => {
              if (objective.type === type && !objectiveId.includes('-errata-')) {
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
            if (source !== 'regular' && !contentSources[source as keyof typeof contentSources]) {
              return;
            }

            /* eslint-disable @typescript-eslint/no-explicit-any */
            Object.entries(objectivesData).forEach(([objectiveId, objective]: [string, any]) => {
              if (objective.type === type && objectiveId.includes('-errata-')) {
                const baseId = objectiveId.replace(/-errata-(legacy|legends|oldLegacy|arc)$/, '');
                
                if (errataKeys.includes(objectiveId)) {
                  objectiveMap.set(baseId, {
                    id: objectiveId,
                    name: objective.name,
                    type: objective.type,
                    cardimage: validateImageUrl(objective.cardimage),
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
        setDisplayedObjectives(Array.from(objectiveMap.values()));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching objectives:', error);
      }
    };

    fetchObjectives();
  }, [type, contentSources]);

  // Add new useEffect for sorting and filtering
  useEffect(() => {
    const sortAndFilterObjectives = () => {
      let sortedObjectives = [...objectives];

      // Filter objectives based on search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        sortedObjectives = sortedObjectives.filter(objective => 
          objective.name.toLowerCase().includes(searchLower)
        );
      }

      const sortFunctions: Record<SortOption, (a: ObjectiveModel, b: ObjectiveModel) => number> = {
        custom: (a, b) => {
          if (a.source === b.source) return 0;
          if (a.source !== 'regular' && b.source === 'regular') return -1;
          if (a.source === 'regular' && b.source !== 'regular') return 1;
          return 0;
        },
        alphabetical: (a, b) => a.name.localeCompare(b.name),
        points: () => 0,  // No-op for objectives
        unique: () => 0,  // No-op for objectives
      };

      const sortPriority: SortOption[] = ['custom', 'alphabetical', 'points', 'unique'];

      sortedObjectives.sort((a, b) => {
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

      setDisplayedObjectives(sortedObjectives);
    };

    sortAndFilterObjectives();
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
    <div className="fixed inset-0 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30 flex items-center justify-center z-50">
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
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mr-2">Select a {type.charAt(0).toUpperCase() + type.slice(1)} Objective</h2>
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
              {displayedObjectives.map((objective) => (
                <div key={objective.id} className="w-full aspect-[2.5/3.5]">
                  <Button
                    onClick={() => onSelectObjective(objective)}
                    className="p-0 overflow-hidden relative w-full h-full rounded-lg bg-transparent"
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}