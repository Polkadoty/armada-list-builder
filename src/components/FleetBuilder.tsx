/* eslint-disable @typescript-eslint/no-empty-interface */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Filter, Printer, ArrowLeft, FileText } from 'lucide-react';
import { ShipSelector } from './ShipSelector';
import { SelectedShip } from './SelectedShip';
import { ShipFilter } from './ShipFilter';

interface Ship {
  id: string; // Add this line
  name: string;
  points: number;
  cardimage: string;
  faction: string;
}

export default function FleetBuilder({ faction }: { faction: string }) {
  const [fleetName, setFleetName] = useState('Untitled Fleet');
  const [isEditingName, setIsEditingName] = useState(false);
  const [points, setPoints] = useState(0);
  const [showShipSelector, setShowShipSelector] = useState(false);
  const [selectedShips, setSelectedShips] = useState<Ship[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [shipFilter, setShipFilter] = useState({ minPoints: 0, maxPoints: 1000 });

  const handleNameClick = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFleetName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
  };

  const handleAddShip = () => {
    setShowShipSelector(true);
  };

  const handleSelectShip = (ship: Ship) => {
    const newShip = { ...ship, id: Date.now().toString() };
    setSelectedShips([...selectedShips, newShip]);
    setPoints(points + ship.points);
    setShowShipSelector(false);
  };

  const handleRemoveShip = (id: string) => {
    const shipToRemove = selectedShips.find(ship => ship.id === id);
    if (shipToRemove) {
      setSelectedShips(selectedShips.filter(ship => ship.id !== id));
      setPoints(points - shipToRemove.points);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="mb-2 sm:mb-0">
          {isEditingName ? (
            <Input
              value={fleetName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className="text-xl font-bold"
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-bold cursor-pointer" onClick={handleNameClick}>
              {fleetName}
            </h2>
          )}
        </div>
        <div className="text-xl font-bold">{points} points</div>
      </div>

      {selectedShips.map((ship) => (
        <SelectedShip key={ship.id} ship={ship} onRemove={handleRemoveShip} />
      ))}

      <Card className="mb-4 relative">
        <Button className="w-full justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" variant="outline" onClick={handleAddShip}>
          ADD SHIP <Filter size={16} onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); }} />
        </Button>
        {showFilter && <ShipFilter onApplyFilter={setShipFilter} onClose={() => setShowFilter(false)} />}
      </Card>

      <Card className="mb-4">
        <Button className="w-full justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" variant="outline">
          ADD SQUADRON <Filter size={16} />
        </Button>
      </Card>

      <div className="space-y-2 mb-4">
        <Button variant="outline" className="w-full justify-start">ADD ASSAULT</Button>
        <Button variant="outline" className="w-full justify-start">ADD DEFENSE</Button>
        <Button variant="outline" className="w-full justify-start">ADD NAVIGATION</Button>
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" className="flex-grow">
          <Printer className="mr-2 h-4 w-4" /> PRINT
        </Button>
        <Button variant="outline" className="flex-grow">
          <ArrowLeft className="mr-2 h-4 w-4" /> BACK
        </Button>
        <Button variant="outline" className="flex-grow">
          <FileText className="mr-2 h-4 w-4" /> EXPORT TEXT
        </Button>
      </div>

      {showShipSelector && (
        <ShipSelector
          faction={faction}
          filter={shipFilter}
          onSelectShip={handleSelectShip}
          onClose={() => setShowShipSelector(false)}
        />
      )}
    </div>
  );
}