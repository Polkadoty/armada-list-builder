import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

export interface ObjectiveModel {
  id: string;
  name: string;
  type: string;
  cardimage: string;
}

interface CachedObjective {
  _id: string;
  name: string;
  type: string;
  cardimage: string;
}

interface ObjectiveSelectorProps {
  type: 'assault' | 'defense' | 'navigation';
  onSelectObjective: (objective: ObjectiveModel) => void;
  onClose: () => void;
}

export function ObjectiveSelector({ type, onSelectObjective, onClose }: ObjectiveSelectorProps) {
  const [objectives, setObjectives] = useState<ObjectiveModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObjectives = () => {
      setLoading(true);
      try {
        const cachedObjectives = localStorage.getItem('objectives');
        if (cachedObjectives) {
          const objectiveData = JSON.parse(cachedObjectives).objectives as Record<string, CachedObjective>;
          const flattenedObjectives = Object.values(objectiveData)
            .filter((objective) => objective.type === type)
            .map((objective) => ({
              id: objective._id,
              name: objective.name,
              type: objective.type,
              cardimage: validateImageUrl(objective.cardimage),
            }));
          setObjectives(flattenedObjectives);
        } else {
          console.error('Objectives data not found in localStorage');
        }
      } catch (error) {
        console.error('Error fetching objectives:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchObjectives();
  }, [type]);

  const validateImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://api.swarmada.wiki${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full h-full sm:w-11/12 sm:h-5/6 lg:w-3/4 lg:h-3/4 flex flex-col">
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Select a {type.charAt(0).toUpperCase() + type.slice(1)} Objective</h2>
          <Button variant="ghost" onClick={onClose} className="p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          {loading ? (
            <p>Loading objectives...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {objectives.map((objective) => (
                <div key={objective.id} className="w-full aspect-[2/3]">
                  <Button
                    onClick={() => onSelectObjective(objective)}
                    className="p-0 overflow-hidden relative w-full h-full rounded-lg"
                  >
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <Image
                        src={objective.cardimage}
                        alt={objective.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover object-center scale-[103%]"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-objective.png';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2">
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
