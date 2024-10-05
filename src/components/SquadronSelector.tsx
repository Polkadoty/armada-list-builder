import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

export interface SquadronModel {
  id: string;
  name: string;
  'ace-name'?: string;
  points: number;
  cardimage: string;
  faction: string;
  hull: number;
  speed: number;
  unique: boolean;
  count: number;
}

interface SquadronSelectorProps {
  faction: string;
  filter: { minPoints: number; maxPoints: number };
  onSelectSquadron: (squadron: SquadronModel) => void;
  onClose: () => void;
}

// Add this constant at the top of your file
const CACHE_VERSION = '1';

export function SquadronSelector({ faction, filter, onSelectSquadron, onClose }: SquadronSelectorProps) {
  const [squadrons, setSquadrons] = useState<SquadronModel[]>([]);

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
            const typedSquadron = squadron as SquadronModel;
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
            };
          }).filter((squadron): squadron is SquadronModel => 
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

  // Add this function to validate and fix image URLs
  const validateImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://api.swarmada.wiki${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-3/4 h-3/4 overflow-auto">
        <CardContent>
          <h2 className="text-2xl font-bold mb-4">Select a Squadron</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {squadrons.map((squadron) => (
              <div key={squadron.id} className="w-full aspect-[2/3]">
                <Button
                  onClick={() => onSelectSquadron(squadron)}
                  className="p-0 overflow-hidden relative w-full h-full rounded-lg"
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
      </Card>
    </div>
  );
}