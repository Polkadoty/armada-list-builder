import { Card, CardContent } from "@/components/ui/card";

interface Ship {
    id: string;
    name: string;
    points: number;
    cardimage: string;
    faction: string;
  }

  interface SelectedShipProps {
    ship: Ship;
    onRemove: (id: string) => void;
  }
  
  export function SelectedShip({ ship, onRemove }: SelectedShipProps) {
    return (
      <Card className="mb-2">
        <CardContent className="flex justify-between items-center p-2">
          <span className="font-bold">{ship.name}</span>
          <div className="flex items-center">
            <span className="mr-2">{ship.points} points</span>
            <button onClick={() => onRemove(ship.id)} className="text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }