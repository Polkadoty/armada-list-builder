import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentSource, Squadron } from './FleetBuilder';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Cookies from 'js-cookie';
import { OptimizedImage } from '@/components/OptimizedImage';
import { sanitizeImageUrl } from '@/utils/dataFetcher';

interface SquadronSelectorProps {
  faction: string;
  filter: { minPoints: number; maxPoints: number };
  onSelectSquadron: (squadron: Squadron) => void;
  onClose: () => void;
  selectedSquadrons: Squadron[];
}

interface SquadronData {
  squadrons: Record<string, Squadron>;
}

export function SquadronSelector({ faction, filter, onSelectSquadron, onClose, selectedSquadrons }: SquadronSelectorProps) {
  const [allSquadrons, setAllSquadrons] = useState<Squadron[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const { uniqueClassNames, addUniqueClassName } = useUniqueClassContext();
  const [activeSorts, setActiveSorts] = useState<Record<SortOption, 'asc' | 'desc' | null>>(() => {
    const savedSorts = Cookies.get(`sortState_squadrons`);
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
  const [contentSources, setContentSources] = useState({
    arc: Cookies.get('enableArc') === 'true',
    legacy: Cookies.get('enableLegacy') === 'true',
    legends: Cookies.get('enableLegends') === 'true',
    oldLegacy: Cookies.get('enableOldLegacy') === 'true',
    amg: Cookies.get('enableAMG') === 'true'
  });
  
  // Use ref to track latest contentSources without creating dependencies
  const contentSourcesRef = useRef(contentSources);
  
  // Update ref when contentSources changes
  useEffect(() => {
    contentSourcesRef.current = contentSources;
  }, [contentSources]);

  // Improved cookie tracking that dispatches a custom event when cookies change
  useEffect(() => {
    const originalSet = Cookies.set;
    
    // Override Cookies.set to dispatch an event when a content toggle cookie changes
    Cookies.set = function(...args) {
      const [name] = args;
      const result = originalSet.apply(this, args);
      
      // If the cookie being set is related to content sources, dispatch event
      if (name && name.startsWith('enable')) {
        const event = new CustomEvent('content-source-changed', { 
          detail: { cookie: name } 
        });
        document.dispatchEvent(event);
      }
      
      return result;
    };
    
    // Handle the custom event
    const handleContentSourceChange = () => {
      const newContentSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        oldLegacy: Cookies.get('enableOldLegacy') === 'true',
        amg: Cookies.get('enableAMG') === 'true'
      };
      
      console.log('Content source event triggered, new settings:', newContentSources);
      setContentSources(newContentSources);
    };
    
    document.addEventListener('content-source-changed', handleContentSourceChange);
    
    // Regular interval check as fallback
    const checkCookies = () => {
      const newContentSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        oldLegacy: Cookies.get('enableOldLegacy') === 'true',
        amg: Cookies.get('enableAMG') === 'true'
      };

      // Compare with the ref value instead of state to avoid circular dependencies
      if (JSON.stringify(newContentSources) !== JSON.stringify(contentSourcesRef.current)) {
        console.log('Content source settings changed via interval check:', newContentSources);
        setContentSources(newContentSources);
      }
    };
    
    // Check immediately on mount
    checkCookies();
    
    // Set up an interval as a backup
    const interval = setInterval(checkCookies, 1000);
    
    return () => {
      // Restore original Cookies.set
      Cookies.set = originalSet;
      clearInterval(interval);
      document.removeEventListener('content-source-changed', handleContentSourceChange);
    };
  }, []);  // No dependencies, using ref instead

  const fetchSquadrons = useCallback(() => {
    const cachedSquadrons = localStorage.getItem('squadrons');
    const cachedLegacySquadrons = localStorage.getItem('legacySquadrons');
    const cachedLegendsSquadrons = localStorage.getItem('legendsSquadrons');
    const cachedOldLegacySquadrons = localStorage.getItem('oldLegacySquadrons');
    const cachedArcSquadrons = localStorage.getItem('arcSquadrons');
    const cachedAMGSquadrons = localStorage.getItem('amgSquadrons');

    const squadronMap = new Map<string, Squadron>();

    const processSquadrons = (data: SquadronData, prefix: string = '') => {
      if (prefix && !contentSourcesRef.current[prefix as keyof typeof contentSourcesRef.current]) {
        return;
      }
      
      if (data && data.squadrons) {
        Object.entries(data.squadrons).forEach(([squadronId, squadron]) => {
          const aceName = squadron['ace-name'] && squadron['ace-name'] !== '' ? squadron['ace-name'] : '';
          const uniqueKey = `${prefix}-${squadronId}-${squadron.name}-${aceName}`;
          if (!squadronMap.has(uniqueKey)) {
            const abilityText = Object.entries(squadron.abilities || {})
            /* eslint-disable */
              .filter(([_key, value]) => value !== 0 && value !== false)
              .map(([key, value]) => typeof value === 'boolean' ? key : `${key} ${value}`)
              .join(' ');
      
            const armamentText = Object.entries(squadron.armament || {}).map(([key, value]) => {
              const diceColors = ['red', 'blue', 'black'];
              return value.map((dice, index) => dice > 0 ? `${key} ${diceColors[index]}` : '').filter(Boolean);
            }).flat().join(' ');
      
            squadronMap.set(uniqueKey, {
              ...squadron,
              id: squadronId,
              name: squadron.name,
              'ace-name': aceName,
              squadron_type: squadron.squadron_type,
              points: squadron.points,
              cardimage: sanitizeImageUrl(squadron.cardimage),
              faction: squadron.faction,
              hull: squadron.hull,
              speed: squadron.speed,
              unique: squadron.unique,
              count: 1,
              ace: squadron.ace || false,
              'unique-class': squadron['unique-class'] || [],
              source: (prefix || 'regular') as ContentSource,
              searchableText: JSON.stringify({
                ...squadron,
                abilities: abilityText,
                armament: armamentText,
                tokens: Object.entries(squadron.tokens || {})
                /* eslint-disable */
                .filter(([_key, value]) => value > 0)
                .reduce((acc, [key, value]) => ({ ...acc, [key.replace('def_', '')]: value }), {})
              }).toLowerCase()
            });
          }
        });
      }
    };

    if (cachedSquadrons) {
      const squadronData = JSON.parse(cachedSquadrons);
      processSquadrons(squadronData);
    }

    if (contentSourcesRef.current.legacy && cachedLegacySquadrons) {
      const legacySquadronData = JSON.parse(cachedLegacySquadrons);
      processSquadrons(legacySquadronData, 'legacy');
    }

    if (contentSourcesRef.current.legends && cachedLegendsSquadrons) {
      const legendsSquadronData = JSON.parse(cachedLegendsSquadrons);
      processSquadrons(legendsSquadronData, 'legends');
    }

    if (contentSourcesRef.current.oldLegacy && cachedOldLegacySquadrons) {
      const oldLegacySquadronData = JSON.parse(cachedOldLegacySquadrons);
      processSquadrons(oldLegacySquadronData, 'oldLegacy');
    }

    if (contentSourcesRef.current.amg && cachedAMGSquadrons) {
      const amgSquadronData = JSON.parse(cachedAMGSquadrons);
      processSquadrons(amgSquadronData, 'amg');
    }

    if (contentSourcesRef.current.arc && cachedArcSquadrons) {
      const arcSquadronData = JSON.parse(cachedArcSquadrons);
      processSquadrons(arcSquadronData, 'arc');
    }

    const errataKeys = JSON.parse(localStorage.getItem('errataKeys') || '{}');
    const squadronErrataKeys = errataKeys.squadrons || [];

    let squadronsArray = Array.from(squadronMap.values());
    console.log(`Loaded ${squadronsArray.length} squadrons from sources`);

    const squadronGroups = new Map<string, Squadron[]>();

    squadronsArray.forEach(squadron => {
      const baseName = squadron.id.replace(/-errata(-[^-]+)?$/, '');
      
      if (!squadronGroups.has(baseName)) {
        squadronGroups.set(baseName, []);
      }
      squadronGroups.get(baseName)?.push(squadron);
    });

    squadronsArray = Array.from(squadronGroups.values()).map(group => {
      const enabledSourceGroup = group.filter(squadron => {
        if (squadron.source === 'regular') return true;
        
        return contentSourcesRef.current[squadron.source as keyof typeof contentSourcesRef.current] === true;
      });
      
      if (enabledSourceGroup.length === 0) return undefined;
      
      const hasErrata = squadronErrataKeys.some((errataKey: string) => {
        const matchingSquadron = enabledSourceGroup.find(squadron => squadron.id === errataKey);
        if (!matchingSquadron) return false;
        
        if (errataKey.endsWith('-errata')) {
          return contentSourcesRef.current.amg;
        }
        
        return true;
      });

      if (hasErrata) {
        const errataSquadron = enabledSourceGroup.find(squadron => 
          squadronErrataKeys.includes(squadron.id)
        );
        
        return errataSquadron || enabledSourceGroup[0];
      }
      
      return enabledSourceGroup[0];
    }).filter((squadron): squadron is Squadron => squadron !== undefined);

    const filteredSquadrons = squadronsArray.filter(squadron => {
      if (faction === 'sandbox') {
        const baseFactions = ['rebel', 'empire', 'republic', 'separatist'];
        const allowedFactions = [...baseFactions];
        
        if (contentSourcesRef.current.legends) {
          allowedFactions.push('scum');
          allowedFactions.push('new-republic');
        }
        
        return allowedFactions.includes(squadron.faction) &&
          squadron.points >= filter.minPoints &&
          squadron.points <= filter.maxPoints;
      }
      
      return squadron.faction === faction &&
        squadron.points >= filter.minPoints &&
        squadron.points <= filter.maxPoints;
    });

    const sortedSquadrons = filteredSquadrons.sort((a, b) => {
      if (a.squadron_type !== b.squadron_type) {
        return a.squadron_type.localeCompare(b.squadron_type);
      }
      return a.name.localeCompare(b.name);
    });

    console.log(`Setting ${sortedSquadrons.length} squadrons after filtering`);
    setAllSquadrons(sortedSquadrons);
  }, [faction, filter.minPoints, filter.maxPoints]);

  useEffect(() => {
    console.log('Content sources updated, refreshing squadrons');
    // Clear the current squadrons state to ensure complete refresh
    setAllSquadrons([]);
    // Use setTimeout to ensure state update completes before fetching
    const timer = setTimeout(() => {
      console.log('Current content source settings:', JSON.stringify(contentSourcesRef.current));
      fetchSquadrons();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [contentSources, faction, filter.minPoints, filter.maxPoints, fetchSquadrons]);

  const processedSquadrons = useMemo(() => {
    console.log(`Processing ${allSquadrons.length} squadrons with filters`);
    // Apply search filter if needed
    let filtered = allSquadrons;
    
    if (searchQuery) {
      filtered = filtered.filter(squadron =>
        squadron.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (squadron['ace-name'] && squadron['ace-name'].toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply points filter
    filtered = filtered.filter(squadron => 
      squadron.points >= filter.minPoints && 
      squadron.points <= filter.maxPoints
    );

    // Define sort functions
    const sortFunctions: Record<SortOption, (a: Squadron, b: Squadron) => number> = {
      custom: (a, b) => {
        if (a.source === b.source) return 0;
        if (a.source !== 'regular' && b.source === 'regular') return -1;
        if (a.source === 'regular' && b.source !== 'regular') return 1;
        return 0;
      },
      unique: (a, b) => (a.unique === b.unique ? 0 : a.unique ? -1 : 1),
      points: (a, b) => a.points - b.points,
      alphabetical: (a, b) => {
        if (a['ace-name'] && b['ace-name']) {
          return a['ace-name'].localeCompare(b['ace-name']);
        } else if (a['ace-name']) {
          return a['ace-name'].localeCompare(b.name);
        } else if (b['ace-name']) {
          return a.name.localeCompare(b['ace-name']);
        } else {
          return a.name.localeCompare(b.name);
        }
      },
    };

    const sortPriority: SortOption[] = ['custom', 'unique', 'points', 'alphabetical'];

    // Apply sorting
    filtered.sort((a, b) => {
      // If no active sorts, use default sorting (by squadron_type, then alphabetical)
      if (Object.values(activeSorts).every(sort => sort === null)) {
        if (a.squadron_type !== b.squadron_type) {
          return a.squadron_type.localeCompare(b.squadron_type);
        }
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

    return filtered;
  }, [allSquadrons, activeSorts, searchQuery, filter.minPoints, filter.maxPoints]);

  const handleSortToggle = (option: SortOption) => {
    setActiveSorts(prevSorts => {
      const newSorts = {
        ...prevSorts,
        [option]: prevSorts[option] === null ? 'asc' : prevSorts[option] === 'asc' ? 'desc' : null
      };
      Cookies.set(`sortState_squadrons`, JSON.stringify(newSorts), { expires: 365 });
      return newSorts;
    });
  };

  const isSquadronSelected = (squadron: Squadron) => {
    const isExactMatch = selectedSquadrons.some(s => 
      s.id === squadron.id || 
      (s.name === squadron.name && s['ace-name'] === squadron['ace-name'])
    );

    const hasConflictingUnique = squadron.unique && selectedSquadrons.some(s => 
      s.unique && s['ace-name'] === squadron['ace-name'] && s['ace-name'] !== ''
    );

    const hasConflictingUniqueClass = squadron['unique-class']?.some(uc => 
      uniqueClassNames.includes(uc)
    );

    if (!squadron.unique) {
      return isExactMatch;
    }

    return isExactMatch || hasConflictingUnique || hasConflictingUniqueClass;
  };

  const handleSquadronClick = (squadron: Squadron) => {
    if (isSquadronSelected(squadron)) {
      setPopupMessage("You can't select multiple unique items or conflicting squadrons.");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } else {
      onSelectSquadron(squadron);
      if (squadron.unique) {
        if (squadron['ace-name']) {
          addUniqueClassName(squadron['ace-name']);
        }
      }
      squadron['unique-class']?.forEach(addUniqueClassName);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30">
      <Card className="w-full h-full sm:w-[95%] sm:h-[90%] lg:w-[85%] lg:h-[85%] flex flex-col">
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          {showSearch ? (
            <div className="flex-grow mr-2 relative">
              <Input
                type="text"
                placeholder="Search squadrons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10"
                autoFocus
              />
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setShowSearch(true)} className="flex items-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mr-2">Squadron</h2>
              <Search size={20} />
            </Button>
          )}
          <div className="flex items-center">
            {showSearch && (
              <Button variant="ghost" onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="mr-2">
                <X size={20} />
              </Button>
            )}
            <SortToggleGroup activeSorts={activeSorts} onToggle={handleSortToggle} selectorType="squadrons" />
            <Button variant="ghost" onClick={onClose} className="p-1 ml-2">
              <X size={20} />
            </Button>
          </div>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2">
            {processedSquadrons.map((squadron) => (
              <div key={squadron.id} className="w-full aspect-[2.5/3.5]">
                <Button
                  onClick={() => handleSquadronClick(squadron)}
                  className={`p-0 overflow-hidden relative w-full h-full rounded-lg bg-transparent ${
                    isSquadronSelected(squadron) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isSquadronSelected(squadron)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <OptimizedImage
                      src={squadron.cardimage}
                      alt={squadron.name}
                      width={250}
                      height={350}
                      className="object-cover object-center w-full h-full"
                      onError={() => {}}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2 visually-hidden">
                    {squadron['ace-name'] && (
                      <p className="text-[10px] sm:text-xs font-bold flex items-center justify-center mb-0.5">
                        {squadron.unique && <span className="mr-1 text-yellow-500 text-[10px] sm:text-xs">●</span>}
                        <span className="break-words text-center">{squadron['ace-name']}</span>
                      </p>
                    )}
                    <p className="text-[10px] sm:text-xs font-bold flex items-center justify-center mb-0.5">
                      <span className="break-words text-center">{squadron.name}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-center">{squadron.points} points</p>
                  </div>
                  <div className="sr-only">
                    {JSON.stringify(squadron)}
                  </div>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {showPopup && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 animate-shake">
          {popupMessage}
        </div>
      )}
    </div>
  );
}
