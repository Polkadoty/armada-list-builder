import { Card, CardContent } from "@/components/ui/card";
import Image from 'next/image';
import { Button } from "@/components/ui/button";

interface Squadron {
  id: string;
  name: string;
  points: number;
  cardimage: string;
  faction: string;
  hull: number;
  speed: number;
  // Add other relevant properties
}

interface SelectedSquadronProps {
  squadron: Squadron;
  onRemove: (id: string) => void;
}

export function SelectedSquadron({ squadron, onRemove }: SelectedSquadronProps) {
  return (
    <div className="mb-2">
      <Card className="relative">
        <CardContent className="flex items-center p-2">
          <div className="w-16 aspect-[8/3] mr-4 relative overflow-hidden">
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
            <span className="font-bold">{squadron.name}</span>
            <div className="flex items-center">
              <span className="mr-2">{squadron.points} points</span>
              <button onClick={(e) => { e.stopPropagation(); onRemove(squadron.id); }} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}