import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Squadron } from './FleetBuilder';

interface SquadronSelectorProps {
  faction: string;
  filter: { minPoints: number; maxPoints: number };
  onSelectSquadron: (squadron: Squadron) => void;
  onClose: () => void;
  selectedSquadrons: Squadron[];
  uniqueClassNames: string[];
}

const CACHE_VERSION = '1';

export function SquadronSelector({ faction, filter, onSelectSquadron, onClose, selectedSquadrons, uniqueClassNames }: SquadronSelectorProps) {
  const [squadrons, setSquadrons] = useState<Squadron[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    const fetchSquadrons = async () => {
      const cacheKey = `squadrons_${faction}_v${CACHE_VERSION}`;
      const cachedSquadrons = localStorage.getItem(cacheKey);

      if (cachedSquadrons) {
        setSquadrons(JSON.parse(cachedSquadrons));
      } else {
        try {
          const response = await axios.get(`https://api.swarmada.wiki/api/squadrons/search?faction=${faction}`);
          const squadronData = response.data;
          const flattenedSquadrons = Object.values(squadronData.squadrons).map((squadron: unknown) => {
            const typedSquadron = squadron as Squadron;
            return {
              id: typedSquadron.id,
              name: typedSquadron['ace-name'] && typedSquadron['ace-name'] !== '' ? typedSquadron['ace-name'] : typedSquadron.name,
              points: typedSquadron.points,
              cardimage: validateImageUrl(typedSquadron.cardimage),
              faction: typedSquadron.faction,
              hull: typedSquadron.hull,
              speed: typedSquadron.speed,
              unique: typedSquadron.unique,
              count: 1,
              'unique-class': typedSquadron['unique-class'] || [],
            };
          }).filter((squadron): squadron is Squadron => 
            squadron.points >= filter.minPoints &&
            squadron.points <= filter.maxPoints
          );
          setSquadrons(flattenedSquadrons);
          localStorage.setItem(cacheKey, JSON.stringify(flattenedSquadrons));
        } catch (error) {
          console.error('Error fetching squadrons:', error);
        }
      }
    };

    fetchSquadrons();
  }, [faction, filter]);

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
    return isSelected;
  };

  const handleSquadronClick = (squadron: Squadron) => {
    if (isSquadronSelected(squadron)) {
      setPopupMessage("You can't select multiple unique items.");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } else {
      onSelectSquadron(squadron);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full h-full sm:w-11/12 sm:h-5/6 lg:w-3/4 lg:h-3/4 overflow-auto relative">
        <CardContent className="p-2 sm:p-4">
          <div className="flex justify-between items-center mb-2 sm:mb-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Select a Squadron</h2>
            <Button variant="ghost" onClick={onClose} className="p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
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
                      className="scale-[103%]"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-squadron.png';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2">
                    <p className="text-xs sm:text-sm font-bold flex items-center justify-center">
                      {squadron.unique && <span className="mr-1 text-yellow-500 text-xs sm:text-sm">●</span>}
                      <span className="break-words line-clamp-2 text-center">{squadron.name}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-center">{squadron.points} points</p>
                  </div>
                </Button>
              </div>
            ))}
          </div>
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