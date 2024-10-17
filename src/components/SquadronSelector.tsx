import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Squadron } from './FleetBuilder';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup } from './SortToggleGroup';

interface SquadronSelectorProps {
  faction: string;
  filter: { minPoints: number; maxPoints: number };
  onSelectSquadron: (squadron: Squadron) => void;
  onClose: () => void;
  selectedSquadrons: Squadron[];
  uniqueClassNames: string[];
}
// Add this constant at the top of your file
const CACHE_VERSION = '1';

export function SquadronSelector({ faction, filter, onSelectSquadron, onClose, selectedSquadrons, uniqueClassNames }: SquadronSelectorProps) {
  const [squadrons, setSquadrons] = useState<Squadron[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const { uniqueClassNames, addUniqueClassName } = useUniqueClassContext();
  const [activeSorts, setActiveSorts] = useState<Record<'alphabetical' | 'points' | 'unique' | 'custom', 'asc' | 'desc' | null>>({
    alphabetical: null,
    points: null,
    unique: null,
    custom: null,
  });

  const sortFunctions = useMemo(() => ({
    custom: (a: Squadron, b: Squadron) => {
      const aIsCustom = a.id.startsWith('legacy') || a.id.startsWith('legends');
      const bIsCustom = b.id.startsWith('legacy') || b.id.startsWith('legends');
      return aIsCustom === bIsCustom ? 0 : aIsCustom ? -1 : 1;
    },
    unique: (a: Squadron, b: Squadron) => (a.unique === b.unique ? 0 : a.unique ? -1 : 1),
    points: (a: Squadron, b: Squadron) => a.points - b.points,
    alphabetical: (a: Squadron, b: Squadron) => a.name.localeCompare(b.name),
  }), []);

  const sortSquadrons = useCallback((squadronsToSort: Squadron[]) => {
    // First, deduplicate the squadrons
    const uniqueSquadrons = Array.from(
      new Map(squadronsToSort.map(item => [
        // Use a combination of name, points, and the id (which includes the prefix for legacy/legends)
        `${item.name}-${item.points}-${item.id}`,
        item
      ])).values()
    );

    // Then, sort the unique squadrons
    let sortedSquadrons = [...uniqueSquadrons];

    Object.entries(activeSorts)
      .filter(([_, value]) => value !== null)
      .reverse()
      .forEach(([key, direction]) => {
        sortedSquadrons.sort((a, b) => {
          const result = sortFunctions[key as keyof typeof sortFunctions](a, b);
          return direction === 'asc' ? result : -result;
        });
      });

    return sortedSquadrons;
  }, [activeSorts, sortFunctions]);

  const fetchSquadrons = useCallback(() => {
    const cachedSquadrons = localStorage.getItem('squadrons');
    const cachedLegacySquadrons = localStorage.getItem('legacySquadrons');
    const cachedLegendsSquadrons = localStorage.getItem('legendsSquadrons');
    
    let allSquadrons: Squadron[] = [];

    const processSquadrons = (data: SquadronData, prefix: string = '') => {
      if (data && data.squadrons) {
        return Object.values(data.squadrons).map((squadron: Squadron) => ({
          ...squadron,
          id: prefix ? `${prefix}-${squadron.id}` : squadron.id,
          name: squadron['ace-name'] && squadron['ace-name'] !== '' ? squadron['ace-name'] : squadron.name,
          points: squadron.points,
          cardimage: validateImageUrl(squadron.cardimage),
          faction: squadron.faction,
          hull: squadron.hull,
          speed: squadron.speed,
          unique: squadron.unique,
          count: 1,
          'unique-class': squadron['unique-class'] || [],
          source: prefix || 'base' // Add this line to explicitly track the source
        }));
      }
      return [];
    };

    if (cachedSquadrons) {
      const squadronData = JSON.parse(cachedSquadrons);
      allSquadrons = [...allSquadrons, ...processSquadrons(squadronData)];
    }

    if (cachedLegacySquadrons) {
      const legacySquadronData = JSON.parse(cachedLegacySquadrons);
      allSquadrons = [...allSquadrons, ...processSquadrons(legacySquadronData, 'legacy')];
    }

    if (cachedLegendsSquadrons) {
      const legendsSquadronData = JSON.parse(cachedLegendsSquadrons);
      allSquadrons = [...allSquadrons, ...processSquadrons(legendsSquadronData, 'legends')];
    }

    const filteredSquadrons = allSquadrons.filter(squadron => 
      squadron.faction === faction &&
      squadron.points >= filter.minPoints &&
      squadron.points <= filter.maxPoints
    );

    setSquadrons(prevSquadrons => sortSquadrons(filteredSquadrons));
  }, [faction, filter.minPoints, filter.maxPoints, sortSquadrons]);

  useEffect(() => {
    fetchSquadrons();
  }, [fetchSquadrons]);

  useEffect(() => {
    setSquadrons(prevSquadrons => sortSquadrons(prevSquadrons));
  }, [activeSorts, sortSquadrons]);

  const validateImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://api.swarmada.wiki${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const isSquadronSelected = (squadron: Squadron) => {
    const isSelected = selectedSquadrons.some(s => s.id === squadron.id) ||
      (squadron.unique && (
        uniqueClassNames.includes(squadron.name) ||
        squadron['unique-class']?.some(uc => uniqueClassNames.includes(uc))
      ));
    console.log(`Checking ${squadron.name}:`, {
      isSelected,
      squadronUniqueClass: squadron['unique-class'],
      uniqueClassNames,
      isUnique: squadron.unique
    });
    return isSelected;
  };

  const handleSquadronClick = (squadron: Squadron) => {
    if (isSquadronSelected(squadron)) {
      setPopupMessage("You can't select multiple unique items.");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } else {
      onSelectSquadron(squadron);
      squadron['unique-class']?.forEach(addUniqueClassName);
    }
  };

  const handleSortToggle = (option: 'alphabetical' | 'points' | 'unique' | 'custom') => {
    setActiveSorts(prev => {
      const newSorts = { ...prev };
      if (newSorts[option] === null) {
        newSorts[option] = 'asc';
      } else if (newSorts[option] === 'asc') {
        newSorts[option] = 'desc';
      } else {
        newSorts[option] = null;
      }
      return newSorts;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full h-full sm:w-11/12 sm:h-5/6 lg:w-3/4 lg:h-3/4 flex flex-col">
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Select a Squadron</h2>
          <SortToggleGroup activeSorts={activeSorts} onToggle={handleSortToggle} />
          <Button variant="ghost" onClick={onClose} className="p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {squadrons.map((squadron) => (
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
                      layout="fill"
                      objectFit="cover"
                      objectPosition="center"
                      className="scale-[102%]"
                      onError={(e) => {
                        console.error(`Error loading image for ${squadron.name}:`, squadron.cardimage);
                        e.currentTarget.src = '/placeholder-squadron.png';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                    <p className="text-sm font-bold truncate flex items-center justify-center">
                      {squadron.unique && <span className="mr-1 text-yellow-500">●</span>}
                      {squadron.name}
                    </p>
                    <p className="text-xs text-center">{squadron.points} points</p>
                  </div>
                </Button>
              </div>
            ))}
          </div>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </CardContent>
        {showPopup && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 animate-shake">
            {popupMessage}
          </div>
        )}
      </Card>
    </div>
  );
}

