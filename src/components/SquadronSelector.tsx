import { useState, useEffect, useMemo } from 'react';
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
import { GamemodeRestrictions } from '@/utils/gamemodeRestrictions';

interface SquadronSelectorProps {
  faction: string;
  filter: { minPoints: number; maxPoints: number };
  onSelectSquadron: (squadron: Squadron) => void;
  onClose: () => void;
  selectedSquadrons: Squadron[];
  aceLimit?: number;
  aceCount?: number;
  gamemodeRestrictions?: GamemodeRestrictions;
}

interface SquadronData {
  squadrons: Record<string, Squadron>;
}

export function SquadronSelector({ 
  faction, 
  filter, 
  onSelectSquadron, 
  onClose, 
  selectedSquadrons, 
  aceLimit = 0, 
  aceCount = 0,
  gamemodeRestrictions 
}: SquadronSelectorProps) {
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

      if (JSON.stringify(newContentSources) !== JSON.stringify(contentSourcesEnabled)) {
        setLoadingState(newContentSources);
      }
    };

    checkCookies();
    const interval = setInterval(checkCookies, 1000);
    return () => clearInterval(interval);
  }, [contentSourcesEnabled]);

  useEffect(() => {
    const fetchSquadrons = () => {
      const cachedSquadrons = localStorage.getItem('squadrons');
      const cachedLegacySquadrons = localStorage.getItem('legacySquadrons');
      const cachedLegendsSquadrons = localStorage.getItem('legendsSquadrons');
      const cachedLegacyBetaSquadrons = localStorage.getItem('legacyBetaSquadrons');
      const cachedArcSquadrons = localStorage.getItem('arcSquadrons');
      const cachedArcBetaSquadrons = localStorage.getItem('arcBetaSquadrons');
      const cachedAMGSquadrons = localStorage.getItem('amgSquadrons');
      const cachedNexusSquadrons = localStorage.getItem('nexusSquadrons');
      const cachedNabooSquadrons = localStorage.getItem('nabooSquadrons');

      const squadronMap = new Map<string, Squadron>();

      const processSquadrons = (data: SquadronData, prefix: string = '') => {
        if (data && data.squadrons) {
          Object.entries(data.squadrons).forEach(([squadronId, squadron]) => {
            const aceName = squadron['ace-name'] && squadron['ace-name'] !== '' ? squadron['ace-name'] : '';
            const uniqueKey = `${prefix}-${squadronId}-${squadron.name}-${aceName}`;
            if (!squadronMap.has(uniqueKey)) {
              const abilityText = Object.entries(squadron.abilities || {})
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .filter(([_, value]) => value !== 0 && value !== false)
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
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    .filter(([_, value]) => value > 0)
                    .reduce((acc, [key, value]) => ({ ...acc, [key.replace('def_', '')]: value }), {})
                }).toLowerCase(),
                keywords: extractKeywordsFromAbilities(squadron.abilities)
              });
            }
          });
        }
      };

      if (cachedSquadrons) {
        const squadronData = JSON.parse(cachedSquadrons);
        processSquadrons(squadronData);
      }

      if (cachedLegacySquadrons) {
        const legacySquadronData = JSON.parse(cachedLegacySquadrons);
        processSquadrons(legacySquadronData, 'legacy');
      }

      if (cachedLegendsSquadrons) {
        const legendsSquadronData = JSON.parse(cachedLegendsSquadrons);
        processSquadrons(legendsSquadronData, 'legends');
      }

      if (cachedLegacyBetaSquadrons) {
        const legacyBetaSquadronData = JSON.parse(cachedLegacyBetaSquadrons);
        processSquadrons(legacyBetaSquadronData, 'legacyBeta');
      }

      if (cachedAMGSquadrons) {
        const amgSquadronData = JSON.parse(cachedAMGSquadrons);
        processSquadrons(amgSquadronData, 'amg');
      }

      if (cachedNexusSquadrons) {
        const nexusSquadronData = JSON.parse(cachedNexusSquadrons);
        processSquadrons(nexusSquadronData, 'nexus');
      }

      if (cachedArcSquadrons) {
        const arcSquadronData = JSON.parse(cachedArcSquadrons);
        processSquadrons(arcSquadronData, 'arc');
      }

      if (cachedArcBetaSquadrons) {
        const arcBetaSquadronData = JSON.parse(cachedArcBetaSquadrons);
        processSquadrons(arcBetaSquadronData, 'arcBeta');
      }

      if (cachedNabooSquadrons) {
        const nabooSquadronData = JSON.parse(cachedNabooSquadrons);
        processSquadrons(nabooSquadronData, 'naboo');
      }

      // Get errata keys from localStorage
      const errataKeys = JSON.parse(localStorage.getItem('errataKeys') || '{}');
      const squadronErrataKeys = errataKeys.squadrons || [];
      // console.log('Errata Keys for Squadrons:', squadronErrataKeys);

      let squadronsArray = Array.from(squadronMap.values());

      // Create a Map to group squadrons by their base name
      const squadronGroups = new Map<string, Squadron[]>();

      squadronsArray.forEach(squadron => {
        // Extract base name without any prefixes or errata suffixes
        const baseName = squadron.id.replace(/^(legacy|legends|legacyBeta|arc|arcBeta|nexus|amg)-/, '').replace(/-errata(-[^-]+)?$/, '');
        
        if (!squadronGroups.has(baseName)) {
          squadronGroups.set(baseName, []);
        }
        squadronGroups.get(baseName)?.push(squadron);
      });

      // Filter out non-errata versions when errata exists
      squadronsArray = Array.from(squadronGroups.values()).map(group => {
        // Check if any squadron in the group has an errata version
        const hasErrata = squadronErrataKeys.some((errataKey: string) => {
          const matchingSquadron = group.find(squadron => squadron.id === errataKey);
          if (!matchingSquadron) return false;
          
          // For AMG errata, check if it's enabled
          if (errataKey.endsWith('-errata')) {
            return Cookies.get('enableAMG') === 'true';
          }
          // Otherwise check content source settings
          const source = matchingSquadron.source;
          return source ? contentSourcesEnabled[source as keyof typeof contentSourcesEnabled] : true;
        });

        if (hasErrata) {
          // Return only the errata version
          return group.find(squadron => 
            squadronErrataKeys.includes(squadron.id) && 
            (squadron.id.endsWith('-errata') ? 
              Cookies.get('enableAMG') === 'true' : 
              contentSourcesEnabled[squadron.source as keyof typeof contentSourcesEnabled])
          );
        }
        
        // If no errata exists, return the first squadron in the group
        return group[0];
      }).filter((squadron): squadron is Squadron => squadron !== undefined);

      const filteredSquadrons = squadronsArray.filter(squadron => {
        // For sandbox mode, include squadrons from all base factions
        if (faction === 'sandbox') {
          const baseFactions = ['rebel', 'empire', 'republic', 'separatist'];
          const allowedFactions = [...baseFactions];
          
          // Include scum faction if legends content is enabled
          
          // Include nexus factions if nexus content is enabled
          if (contentSourcesEnabled.nexus) {
            allowedFactions.push('scum');
            allowedFactions.push('new-republic');
            allowedFactions.push('first-order');
            allowedFactions.push('resistance');
          }
          
          return allowedFactions.includes(squadron.faction) &&
            squadron.points >= filter.minPoints &&
            squadron.points <= filter.maxPoints;
        }
        
        // Normal faction filtering
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

      setAllSquadrons(sortedSquadrons);
    };

    fetchSquadrons();
  }, [faction, filter.minPoints, filter.maxPoints, contentSourcesEnabled]);

  const isSquadronAllowed = (squadron: Squadron, restrictions?: GamemodeRestrictions): boolean => {
    if (!restrictions) return true;

    // Check disallowed squadron keywords
    if (restrictions.disallowedSquadronKeywords && squadron.keywords) {
      for (const keyword of restrictions.disallowedSquadronKeywords) {
        if (squadron.keywords.includes(keyword)) {
          return false;
        }
      }
    }

    // Check allowed squadron keywords (if specified)
    if (restrictions.allowedSquadronKeywords && squadron.keywords) {
      return squadron.keywords.some(keyword => 
        restrictions.allowedSquadronKeywords?.includes(keyword)
      );
    }

    // Check disallowed squadron unique-classes
    if (restrictions.disallowedSquadronUniqueClasses && squadron['unique-class']) {
      for (const uniqueClass of restrictions.disallowedSquadronUniqueClasses) {
        if (squadron['unique-class'].includes(uniqueClass)) {
          return false;
        }
      }
    }

    // Check allowed squadron unique-classes (if specified)
    if (restrictions.allowedSquadronUniqueClasses && squadron['unique-class']) {
      return squadron['unique-class'].some(uniqueClass => 
        restrictions.allowedSquadronUniqueClasses?.includes(uniqueClass)
      );
    }

    return true;
  };

  const processedSquadrons = useMemo(() => {
    let sortedSquadrons = [...allSquadrons];
    
    // Filter squadrons based on search query
    if (searchQuery) {
      sortedSquadrons = sortedSquadrons.filter(squadron => {
        const searchLower = searchQuery.toLowerCase();
        return squadron.searchableText.includes(searchLower);
      });
    }

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
      alphabetical: (a, b) => a.name.localeCompare(b.name),
    };

    const sortPriority: SortOption[] = ['custom', 'unique', 'points', 'alphabetical'];

    // Apply sorting
    sortedSquadrons.sort((a, b) => {
      // If no active sorts, use default sorting (unique first, then alphabetical)
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

    return sortedSquadrons;
  }, [allSquadrons, activeSorts, searchQuery]);

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
    // Check if this exact squadron is already selected
    const isExactMatch = selectedSquadrons.some(s => 
      s.id === squadron.id || 
      (s.name === squadron.name && s['ace-name'] === squadron['ace-name'])
    );

    // Check if a conflicting unique squadron is already selected
    const hasConflictingUnique = squadron.unique && selectedSquadrons.some(s => 
      s.unique && s['ace-name'] === squadron['ace-name'] && s['ace-name'] !== ''
    );

    // Check if any of the unique classes are already in use
    const hasConflictingUniqueClass = squadron['unique-class']?.some(uc => 
      uc !== "" && uniqueClassNames.includes(uc)
    );

    // For non-unique squadrons, don't consider them conflicting
    if (!squadron.unique) {
      return isExactMatch;
    }

    return isExactMatch || hasConflictingUnique || hasConflictingUniqueClass;
  };

  // New comprehensive function to get all restriction messages
  const getSquadronRestrictionMessages = (squadron: Squadron): string[] => {
    const messages: string[] = [];

    // Check gamemode restrictions first
    if (gamemodeRestrictions) {
      // Check allowed squadron keywords
      if (gamemodeRestrictions.allowedSquadronKeywords && squadron.keywords) {
        const hasAllowedKeyword = squadron.keywords.some(keyword => 
          gamemodeRestrictions.allowedSquadronKeywords!.includes(keyword)
        );
        if (!hasAllowedKeyword) {
          messages.push("Squadron type not allowed in this gamemode");
        }
      }

      // Check disallowed squadron keywords
      if (gamemodeRestrictions.disallowedSquadronKeywords && squadron.keywords) {
        const hasDisallowedKeyword = squadron.keywords.some(keyword => 
          gamemodeRestrictions.disallowedSquadronKeywords!.includes(keyword)
        );
        if (hasDisallowedKeyword) {
          messages.push("Squadron type not allowed in this gamemode");
        }
      }

      // Check allowed squadron unique classes
      if (gamemodeRestrictions.allowedSquadronUniqueClasses && squadron['unique-class']) {
        const hasAllowedUniqueClass = squadron['unique-class'].some(uc => 
          gamemodeRestrictions.allowedSquadronUniqueClasses!.includes(uc)
        );
        if (!hasAllowedUniqueClass) {
          messages.push("Squadron not allowed in this gamemode");
        }
      }

      // Check disallowed squadron unique classes
      if (gamemodeRestrictions.disallowedSquadronUniqueClasses && squadron['unique-class']) {
        const hasDisallowedUniqueClass = squadron['unique-class'].some(uc => 
          gamemodeRestrictions.disallowedSquadronUniqueClasses!.includes(uc)
        );
        if (hasDisallowedUniqueClass) {
          messages.push("Squadron not allowed in this gamemode");
        }
      }
    }

    // Check non-gamemode restrictions
    // Check if this exact squadron is already selected
    if (selectedSquadrons.some(s => 
      s.id === squadron.id || 
      (s.name === squadron.name && s['ace-name'] === squadron['ace-name'])
    )) {
      messages.push("Squadron already selected");
    }

    // Check if a conflicting unique squadron is already selected
    if (squadron.unique && selectedSquadrons.some(s => 
      s.unique && s['ace-name'] === squadron['ace-name'] && s['ace-name'] !== ''
    )) {
      messages.push("Conflicting unique squadron already selected");
    }

    // Check if any of the unique classes are already in use
    if (squadron['unique-class']?.some(uc => 
      uc !== "" && uniqueClassNames.includes(uc)
    )) {
      const conflictingUniqueClasses = squadron['unique-class']?.filter(uc => 
        uc !== "" && uniqueClassNames.includes(uc)
      );
      if (conflictingUniqueClasses && conflictingUniqueClasses.length > 0) {
        messages.push(`Unique class already in use: ${conflictingUniqueClasses.join(', ')}`);
      }
    }

    // Check ace limit
    if (aceLimit > 0 && aceCount >= aceLimit && squadron.ace) {
      messages.push(`Ace limit reached (${aceLimit})`);
    }

    return messages;
  };

  const handleSquadronClick = (squadron: Squadron) => {
    if (isSquadronSelected(squadron) || !isSquadronAllowed(squadron, gamemodeRestrictions)) {
      setPopupMessage(
        !isSquadronAllowed(squadron, gamemodeRestrictions) 
          ? "This squadron is not allowed in the current gamemode."
          : "You can't select multiple unique items or conflicting squadrons."
      );
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } else {
      onSelectSquadron(squadron);
      if (squadron.unique) {
        if (squadron['ace-name']) {
          addUniqueClassName(squadron['ace-name']);
        }
      }
      squadron['unique-class']?.filter(uc => uc !== "").forEach(addUniqueClassName);
    }
  };

  // Add utility function to extract keywords from squadron abilities
  const extractKeywordsFromAbilities = (abilities: Record<string, boolean | number>): string[] => {
    const keywords: string[] = [];
    
    Object.entries(abilities || {}).forEach(([key, value]) => {
      // Only include abilities that are active (true for boolean, > 0 for number)
      if ((typeof value === 'boolean' && value) || (typeof value === 'number' && value > 0)) {
        keywords.push(key);
      }
    });
    
    return keywords;
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
          {aceLimit > 0 && aceCount >= aceLimit && (
            <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-center font-semibold">
              You have {aceCount} aces equipped (limit: {aceLimit}). You must remove an ace to add another.
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {processedSquadrons.map((squadron) => (
              <div key={squadron.id} className="aspect-[2.5/3.5]">
                <Button
                  onClick={() => handleSquadronClick(squadron)}
                  className={`p-0 overflow-visible relative w-full h-full rounded-lg bg-transparent ${
                    isSquadronSelected(squadron) || !isSquadronAllowed(squadron, gamemodeRestrictions) || (aceLimit > 0 && aceCount >= aceLimit && squadron.ace) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isSquadronSelected(squadron) || !isSquadronAllowed(squadron, gamemodeRestrictions) || (aceLimit > 0 && aceCount >= aceLimit && squadron.ace)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <OptimizedImage
                      src={squadron.cardimage}
                      alt={squadron.name}
                      width={250}  // Standard poker card width (2.5 inches * 100)
                      height={350} // Standard poker card height (3.5 inches * 100)
                      className="object-cover object-center w-full h-full"
                      onError={() => {}}
                    />
                    {(isSquadronSelected(squadron) || !isSquadronAllowed(squadron, gamemodeRestrictions) || (aceLimit > 0 && aceCount >= aceLimit && squadron.ace)) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 p-2">
                        <div className="text-white text-xs text-center leading-tight w-full px-1">
                          <span className="break-words block" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                          {(() => {
                            const messages = getSquadronRestrictionMessages(squadron);
                            if (messages.length === 0) {
                              return "Squadron not available";
                            }
                            return messages.join(' • ');
                          })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2 visually-hidden">
                    {squadron['ace-name'] && (
                      <p className="text-xs sm:text-xs font-bold flex items-center justify-center mb-0.5">
                        {squadron.unique && <span className="mr-1 text-yellow-500 text-[10px] sm:text-xs">●</span>}
                        <span className="break-words text-center">{squadron.name}</span>
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-center">{squadron.points} points</p>
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
