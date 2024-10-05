import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { useState } from 'react';
import { Squadron } from './FleetBuilder';

interface SelectedSquadronProps {
  squadron: Squadron;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export function SelectedSquadron({ squadron, onRemove, onIncrement, onDecrement }: SelectedSquadronProps) {
  const [showPointChange, setShowPointChange] = useState(false);

  const count = squadron.count || 1;
  const totalPoints = squadron.points * count;

  return (
    <div className="mb-2">
      <Card className="relative">
        <CardContent className="flex items-center p-2">
          <div className="w-16 aspect-[3.75/2] mr-4 relative overflow-hidden">
            <Image 
              src={squadron.cardimage} 
              alt={squadron.name}
              layout="fill"
              objectFit="cover"
              objectPosition="top"
              className="scale-[100%]"
            />
          </div>
          <div className="flex-grow">
            <span className="font-bold flex items-center">
              {squadron.unique && (
                <span className="mr-1 text-yellow-500">●</span>
              )}
              {count > 1 ? `(${count}) ` : ''}{squadron.name}
            </span>
            <div className="flex items-center">
              <span className="mr-2">{totalPoints} points</span>
              {squadron.unique ? (
                <button onClick={(e) => { e.stopPropagation(); onRemove(squadron.id); }} className="text-red-500 hover:text-red-700">
                  ✕
                </button>
              ) : (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDecrement(squadron.id); }}
                    onMouseEnter={() => setShowPointChange(true)}
                    onMouseLeave={() => setShowPointChange(false)}
                    className="text-blue-500 hover:text-blue-700 mr-2 relative"
                  >
                    -
                    {showPointChange && (
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1">
                        -{squadron.points}
                      </span>
                    )}
                  </button>
                  <span className="mr-2">{squadron.count}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onIncrement(squadron.id); }}
                    onMouseEnter={() => setShowPointChange(true)}
                    onMouseLeave={() => setShowPointChange(false)}
                    className="text-green-500 hover:text-green-700 mr-2 relative"
                  >
                    +
                    {showPointChange && (
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1">
                        +{squadron.points}
                      </span>
                    )}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onRemove(squadron.id); }} className="text-red-500 hover:text-red-700">
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}