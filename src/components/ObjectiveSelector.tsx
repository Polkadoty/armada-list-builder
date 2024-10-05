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

interface ObjectiveSelectorProps {
  type: 'assault' | 'defense' | 'navigation';
  onSelectObjective: (objective: ObjectiveModel) => void;
  onClose: () => void;
}

export function ObjectiveSelector({ type, onSelectObjective, onClose }: ObjectiveSelectorProps) {
  const [objectives, setObjectives] = useState<ObjectiveModel[]>([]);

  useEffect(() => {
    const fetchObjectives = async () => {
      try {
        const response = await axios.get(`https://api.swarmada.wiki/api/objectives/search?type=${type}`);
        const objectiveData = response.data.objectives;
        const flattenedObjectives = Object.entries(objectiveData).map(([_, objective]) => ({
          id: (objective as { _id: string })._id,
          name: (objective as { name: string }).name,
          type: (objective as { type: string }).type,
          cardimage: validateImageUrl((objective as { cardimage: string }).cardimage),
        }));
        setObjectives(flattenedObjectives);
      } catch (error) {
        console.error('Error fetching objectives:', error);
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
      <Card className="w-3/4 h-3/4 overflow-auto">
        <CardContent>
          <h2 className="text-2xl font-bold mb-4">Select a {type.charAt(0).toUpperCase() + type.slice(1)} Objective</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                      layout="fill"
                      objectFit="cover"
                      objectPosition="center"
                      className="scale-[102%]"
                      onError={(e) => {
                        console.error(`Error loading image for ${objective.name}:`, objective.cardimage);
                        e.currentTarget.src = '/placeholder-objective.png';
                      }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                    <p className="text-sm font-bold truncate flex items-center justify-center">
                      {objective.name}
                    </p>
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