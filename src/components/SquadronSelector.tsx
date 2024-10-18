import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Squadron } from './FleetBuilder';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";

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
  const [displayedSquadrons, setDisplayedSquadrons] = useState<Squadron[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
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
    const fetchSquadrons = () => {
      const cachedSquadrons = localStorage.getItem('squadrons');
      const cachedLegacySquadrons = localStorage.getItem('legacySquadrons');
      const cachedLegendsSquadrons = localStorage.getItem('legendsSquadrons');
      
      const squadronMap = new Map<string, Squadron>();

      const processSquadrons = (data: SquadronData, prefix: string = '') => {
        if (data && data.squadrons) {
          Object.entries(data.squadrons).forEach(([squadronId, squadron]) => {
            const aceName = squadron['ace-name'] && squadron['ace-name'] !== '' ? squadron['ace-name'] : '';
            const uniqueKey = `${prefix}-${squadronId}-${squadron.name}-${aceName}`;
            if (!squadronMap.has(uniqueKey)) {
              squadronMap.set(uniqueKey, {
                ...squadron,
                id: squadronId,
                name: squadron.name,
                'ace-name': aceName,
                points: squadron.points,
                cardimage: validateImageUrl(squadron.cardimage),
                faction: squadron.faction,
                hull: squadron.hull,
                speed: squadron.speed,
                unique: squadron.unique,
                count: 1,
                'unique-class': squadron['unique-class'] || [],
                type: (prefix || 'regular') as 'regular' | 'legacy' | 'legends'
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

      const allSquadrons = Array.from(squadronMap.values());

      const filteredSquadrons = allSquadrons.filter(squadron => 
        squadron.faction === faction &&
        squadron.points >= filter.minPoints &&
        squadron.points <= filter.maxPoints
      );

      setAllSquadrons(filteredSquadrons);
      setDisplayedSquadrons(filteredSquadrons);
    };

    fetchSquadrons();
  }, [faction, filter.minPoints, filter.maxPoints]);

  useEffect(() => {
    const sortAndFilterSquadrons = () => {
      let sortedSquadrons = [...allSquadrons];

      // Filter squadrons based on search query
      if (searchQuery) {
        sortedSquadrons = sortedSquadrons.filter(squadron => {
          const aceName = squadron['ace-name'] || '';
          const squadronName = squadron.name || '';
          const searchLower = searchQuery.toLowerCase();
          return aceName.toLowerCase().includes(searchLower) ||
                 squadronName.toLowerCase().includes(searchLower);
        });
      }

      const sortFunctions: Record<SortOption, (a: Squadron, b: Squadron) => number> = {
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

      sortedSquadrons.sort((a, b) => {
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

      setDisplayedSquadrons(sortedSquadrons);
    };

    sortAndFilterSquadrons();
  }, [allSquadrons, activeSorts, searchQuery]);

  const handleSortToggle = (option: SortOption) => {
    setActiveSorts(prevSorts => ({
      ...prevSorts,
      [option]: prevSorts[option] === null ? 'asc' : prevSorts[option] === 'asc' ? 'desc' : null
    }));
  };

  const validateImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://api.swarmada.wiki${url.startsWith('/') ? '' : '/'}${url}`;
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
      uniqueClassNames.includes(uc)
    );

    // For non-unique squadrons, don't consider them conflicting
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full h-full sm:w-11/12 sm:h-5/6 lg:w-3/4 lg:h-3/4 flex flex-col">
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
            <SortToggleGroup activeSorts={activeSorts} onToggle={handleSortToggle} />
            <Button variant="ghost" onClick={onClose} className="p-1 ml-2">
              <X size={20} />
            </Button>
          </div>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {displayedSquadrons.map((squadron) => (
              <div key={squadron.id} className="w-full aspect-[2/3]">
                <Button
                  onClick={() => handleSquadronClick(squadron)}
                  className={`p-0 overflow-hidden relative w-full h-full rounded-lg ${
                    isSquadronSelected(squadron) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isSquadronSelected(squadron)}
                >
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <Image
                      src={squadron.cardimage}
                      alt={squadron.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center scale-[103%]"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-squadron.png';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2">
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
