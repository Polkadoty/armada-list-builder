/* eslint-disable @typescript-eslint/no-empty-interface */

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Filter, Printer, ArrowLeft, FileText } from 'lucide-react';
import { ShipSelector } from './ShipSelector';
import { SelectedShip } from './SelectedShip';
import { ShipFilter } from './ShipFilter';
import { ShipModel } from './ShipSelector';
import { SelectedSquadron } from './SelectedSquadron';
import { SquadronFilter } from './SquadronFilter';
import { SquadronSelector } from './SquadronSelector';
import { SquadronModel } from './SquadronSelector';
import { PointsDisplay } from './PointsDisplay';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface Ship {
  id: string;
  name: string;
  points: number;
  cardimage: string;
  faction: string;
  upgrades: string[];
  unique: boolean;
}

interface Squadron {
  id: string;
  name: string;
  points: number;
  cardimage: string;
  faction: string;
  hull: number;
  speed: number;
  unique: boolean;
  count: number;
}

const SectionHeader = ({ title, points, previousPoints, show }: { title: string; points: number; previousPoints: number; show: boolean }) => (
  show ? (
    <div className="flex justify-between items-center mb-2 mt-4 border-b border-gray-300 relative">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="z-40">
        <PointsDisplay points={points} previousPoints={previousPoints} />
      </div>
    </div>
  ) : null
);

export default function FleetBuilder({ faction, factionColor }: { faction: string; factionColor: string }) {
  const [fleetName, setFleetName] = useState('Untitled Fleet');
  const [isEditingName, setIsEditingName] = useState(false);
  const [points, setPoints] = useState(0);
  const [previousPoints, setPreviousPoints] = useState(0);
  const [showShipSelector, setShowShipSelector] = useState(false);
  const [showSquadronSelector, setShowSquadronSelector] = useState(false);
  const [selectedShips, setSelectedShips] = useState<Ship[]>([]);
  const [selectedSquadrons, setSelectedSquadrons] = useState<Squadron[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [shipFilter, setShipFilter] = useState({ minPoints: 0, maxPoints: 1000 });
  const [squadronFilter, setSquadronFilter] = useState({ minPoints: 0, maxPoints: 1000 });
  const [totalShipPoints, setTotalShipPoints] = useState(0);
  const [totalSquadronPoints, setTotalSquadronPoints] = useState(0);
  const [previousShipPoints, setPreviousShipPoints] = useState(0);
  const [previousSquadronPoints, setPreviousSquadronPoints] = useState(0);
  const { theme } = useTheme();

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

  const handleSelectShip = (ship: ShipModel) => {
    const newShip: Ship = { 
      ...ship, 
      id: Date.now().toString(),
      upgrades: ship.upgrades || []
    };
    setSelectedShips([...selectedShips, newShip]);
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    const newPoints = points + ship.points;
    setPoints(newPoints);
    setTotalShipPoints(totalShipPoints + ship.points);
    setShowShipSelector(false);
  };

  const handleRemoveShip = (id: string) => {
    const shipToRemove = selectedShips.find(ship => ship.id === id);
    if (shipToRemove) {
      setSelectedShips(selectedShips.filter(ship => ship.id !== id));
      setPreviousPoints(points);
      setPreviousShipPoints(totalShipPoints);
      const newPoints = points - shipToRemove.points;
      setPoints(newPoints);
      setTotalShipPoints(totalShipPoints - shipToRemove.points);
    }
  };

  const handleUpgradeClick = (shipId: string, upgrade: string) => {
    // Here you can implement the logic for what happens when an upgrade is clicked
    console.log(`Upgrade ${upgrade} clicked for ship ${shipId}`);
    // For example, you might want to open a modal to select a specific upgrade card
  };

  const handleCopyShip = (shipToCopy: Ship) => {
    const newShip = { ...shipToCopy, id: Date.now().toString() };
    setSelectedShips([...selectedShips, newShip]);
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    const newPoints = points + shipToCopy.points;
    setPoints(newPoints);
    setTotalShipPoints(totalShipPoints + shipToCopy.points);
  };

  const handleAddSquadron = () => {
    setShowSquadronSelector(true);
  };

  const handleSelectSquadron = (squadron: SquadronModel) => {
    const newSquadron: Squadron = { 
      ...squadron, 
      id: Date.now().toString(),
      count: 1,
    };
    setSelectedSquadrons([...selectedSquadrons, newSquadron]);
    setPreviousPoints(points);
    setPreviousSquadronPoints(totalSquadronPoints);
    const newPoints = points + squadron.points;
    setPoints(newPoints);
    setTotalSquadronPoints(totalSquadronPoints + squadron.points);
    setShowSquadronSelector(false);
  };

  const handleRemoveSquadron = (id: string) => {
    const squadronToRemove = selectedSquadrons.find(squadron => squadron.id === id);
    if (squadronToRemove) {
      setSelectedSquadrons(selectedSquadrons.filter(squadron => squadron.id !== id));
      setPreviousPoints(points);
      setPreviousSquadronPoints(totalSquadronPoints);
      const newPoints = points - squadronToRemove.points * squadronToRemove.count;
      setPoints(newPoints);
      setTotalSquadronPoints(totalSquadronPoints - squadronToRemove.points * squadronToRemove.count);
    }
  };

  const handleIncrementSquadron = (id: string) => {
    setSelectedSquadrons(squadrons =>
      squadrons.map(squadron =>
        squadron.id === id
          ? { ...squadron, count: (squadron.count || 1) + 1 }
          : squadron
      )
    );
    const squadron = selectedSquadrons.find(s => s.id === id);
    if (squadron) {
      setPreviousPoints(points);
      setPreviousSquadronPoints(totalSquadronPoints);
      const newPoints = points + squadron.points;
      setPoints(newPoints);
      setTotalSquadronPoints(totalSquadronPoints + squadron.points);
    }
  };

  const handleDecrementSquadron = (id: string) => {
    setSelectedSquadrons(squadrons =>
      squadrons.map(squadron =>
        squadron.id === id && (squadron.count || 1) > 1
          ? { ...squadron, count: (squadron.count || 1) - 1 }
          : squadron
      )
    );
    const squadron = selectedSquadrons.find(s => s.id === id);
    if (squadron && (squadron.count || 1) > 1) {
      setPreviousPoints(points);
      setPreviousSquadronPoints(totalSquadronPoints);
      const newPoints = points - squadron.points;
      setPoints(newPoints);
      setTotalSquadronPoints(totalSquadronPoints - squadron.points);
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
        <PointsDisplay points={points} previousPoints={previousPoints} />
      </div>

      <SectionHeader 
        title="Ships" 
        points={totalShipPoints} 
        previousPoints={previousShipPoints} 
        show={selectedShips.length > 0}
      />
      <div className="mb-4">
        {selectedShips.map((ship) => (
          <SelectedShip key={ship.id} ship={ship} onRemove={handleRemoveShip} onUpgradeClick={handleUpgradeClick} onCopy={handleCopyShip} />
        ))}
      </div>

      <SectionHeader 
        title="Squadrons" 
        points={totalSquadronPoints} 
        previousPoints={previousSquadronPoints} 
        show={selectedSquadrons.length > 0}
      />
      <div className="mb-4">
        {selectedSquadrons.map((squadron) => (
          <SelectedSquadron key={squadron.id} squadron={squadron} onRemove={handleRemoveSquadron} onIncrement={handleIncrementSquadron} onDecrement={handleDecrementSquadron} />
        ))}
      </div>

      <Card className="mb-4 relative">
        <Button 
          className="w-full justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          variant="outline" 
          onClick={handleAddShip}
        >
          ADD SHIP <Filter size={16} onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); }} />
        </Button>
        {showFilter && <ShipFilter onApplyFilter={setShipFilter} onClose={() => setShowFilter(false)} />}
      </Card>

      <Card className="mb-4 relative">
        <Button 
          className="w-full justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          variant="outline" 
          onClick={handleAddSquadron}
        >
          ADD SQUADRON <Filter size={16} onClick={(e) => { e.stopPropagation(); setShowFilter(!showFilter); }} />
        </Button>
        {showFilter && <SquadronFilter onApplyFilter={setSquadronFilter} onClose={() => setShowFilter(false)} />}
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
        <Link href="/">
          <Button variant="outline" className="flex-grow">
            <ArrowLeft className="mr-2 h-4 w-4" /> BACK
          </Button>
        </Link>
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

      {showSquadronSelector && (
        <SquadronSelector
          faction={faction}
          filter={squadronFilter}
          onSelectSquadron={handleSelectSquadron}
          onClose={() => setShowSquadronSelector(false)}
        />
      )}
    </div>
  );
}