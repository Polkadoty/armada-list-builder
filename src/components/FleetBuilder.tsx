/* eslint-disable @typescript-eslint/no-empty-interface */

import { useState } from 'react';
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
import { PointsDisplay } from './PointsDisplay';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ObjectiveSelector, ObjectiveModel } from './ObjectiveSelector';
import UpgradeSelector from './UpgradeSelector';

export interface Ship {
  id: string;
  name: string;
  points: number;
  cardimage: string;
  faction: string;
  availableUpgrades: string[];
  assignedUpgrades: Upgrade[];
  unique: boolean;
}

export interface Squadron {
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
  'unique-class': string[];
}

export interface Upgrade {
  name: string;
  points: number;
  ability: string;
  unique: boolean;
  artwork: string;
  cardimage: string;
  type: string;
  faction: string[];
  "unique-class": string[];
  bound_shiptype: string;
}

export interface Ship extends ShipModel {
  id: string;
  availableUpgrades: string[];
  assignedUpgrades: Upgrade[];
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

export default function FleetBuilder({ faction }: { faction: string; factionColor: string }) {
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
  const { } = useTheme();
  const [showAssaultObjectiveSelector, setShowAssaultObjectiveSelector] = useState(false);
  const [showDefenseObjectiveSelector, setShowDefenseObjectiveSelector] = useState(false);
  const [showNavigationObjectiveSelector, setShowNavigationObjectiveSelector] = useState(false);
  const [selectedAssaultObjective, setSelectedAssaultObjective] = useState<ObjectiveModel | null>(null);
  const [selectedDefenseObjective, setSelectedDefenseObjective] = useState<ObjectiveModel | null>(null);
  const [selectedNavigationObjective, setSelectedNavigationObjective] = useState<ObjectiveModel | null>(null);
  const [uniqueClassNames, setUniqueClassNames] = useState<string[]>([]);
  const [showUpgradeSelector, setShowUpgradeSelector] = useState(false);
  const [currentUpgradeType, setCurrentUpgradeType] = useState('');
  const [currentShipId, setCurrentShipId] = useState('');

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
      availableUpgrades: ship.upgrades || [],
      assignedUpgrades: []
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
      const shipPoints = shipToRemove.points + shipToRemove.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0);
      setSelectedShips(selectedShips.filter(ship => ship.id !== id));
      setPreviousPoints(points);
      setPreviousShipPoints(totalShipPoints);
      const newPoints = points - shipPoints;
      setPoints(newPoints);
      setTotalShipPoints(totalShipPoints - shipPoints);
    }
  };

  const handleUpgradeClick = (shipId: string, upgradeType: string) => {
    setCurrentShipId(shipId);
    setCurrentUpgradeType(upgradeType);
    setShowUpgradeSelector(true);
  };
  
  const handleSelectUpgrade = (upgrade: Upgrade) => {
    setSelectedShips(prevShips => 
      prevShips.map(ship => 
        ship.id === currentShipId
          ? { ...ship, assignedUpgrades: [...ship.assignedUpgrades, upgrade] }
          : ship
      )
    );
    setPoints(prevPoints => prevPoints + upgrade.points);
    setTotalShipPoints(prevTotal => prevTotal + upgrade.points);
    setShowUpgradeSelector(false);
  };

  const handleRemoveUpgrade = (shipId: string, upgradeType: string) => {
    setSelectedShips(prevShips => 
      prevShips.map(ship => {
        if (ship.id === shipId) {
          const upgradeToRemove = ship.assignedUpgrades.find(u => u.type === upgradeType);
          if (upgradeToRemove) {
            setPoints(prevPoints => prevPoints - upgradeToRemove.points);
            setTotalShipPoints(prevTotal => prevTotal - upgradeToRemove.points);
          }
          return {
            ...ship,
            assignedUpgrades: ship.assignedUpgrades.filter(u => u.type !== upgradeType)
          };
        }
        return ship;
      })
    );
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

  const handleSelectSquadron = (squadron: Squadron) => {
    console.log('Selecting squadron:', squadron);
    const newSquadron: Squadron = { 
      ...squadron, 
      id: Date.now().toString(),
      count: 1,
    };
    setSelectedSquadrons(prevSquadrons => {
      console.log('Previous squadrons:', prevSquadrons);
      return [...prevSquadrons, newSquadron];
    });
    setPreviousPoints(points);
    setPreviousSquadronPoints(totalSquadronPoints);
    const newPoints = points + squadron.points;
    setPoints(newPoints);
    setTotalSquadronPoints(totalSquadronPoints + squadron.points);
    setUniqueClassNames(prevNames => {
      const newNames = [
        ...prevNames, 
        ...(squadron['unique-class'] || []),
        squadron.name
      ];
      console.log('Updated unique class names:', newNames);
      return Array.from(new Set(newNames)); // Remove duplicates
    });
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
      setUniqueClassNames(prevNames => 
        prevNames.filter(name => 
          !squadronToRemove['unique-class']?.includes(name) && name !== squadronToRemove.name
        )
      );
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

  const handleSelectAssaultObjective = (objective: ObjectiveModel) => {
    setSelectedAssaultObjective(objective);
    setShowAssaultObjectiveSelector(false);
  };

  const handleSelectDefenseObjective = (objective: ObjectiveModel) => {
    setSelectedDefenseObjective(objective);
    setShowDefenseObjectiveSelector(false);
  };

  const handleSelectNavigationObjective = (objective: ObjectiveModel) => {
    setSelectedNavigationObjective(objective);
    setShowNavigationObjectiveSelector(false);
  };

  const handleRemoveAssaultObjective = () => {
    setSelectedAssaultObjective(null);
  };
  
  const handleRemoveDefenseObjective = () => {
    setSelectedDefenseObjective(null);
  };
  
  const handleRemoveNavigationObjective = () => {
    setSelectedNavigationObjective(null);
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
          <SelectedShip key={ship.id} ship={ship} onRemove={handleRemoveShip} onUpgradeClick={handleUpgradeClick} onCopy={handleCopyShip} handleRemoveUpgrade={handleRemoveUpgrade} />
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
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-[#EB3F3A] hover:text-white transition-colors"
          onClick={() => setShowAssaultObjectiveSelector(true)}
        >
          {selectedAssaultObjective ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#EB3F3A] mr-2"></div>
                {selectedAssaultObjective.name}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleRemoveAssaultObjective(); }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ) : "ADD ASSAULT"}
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-[#FAEE13] hover:text-black transition-colors"
          onClick={() => setShowDefenseObjectiveSelector(true)}
        >
          {selectedDefenseObjective ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#FAEE13] mr-2"></div>
                {selectedDefenseObjective.name}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleRemoveDefenseObjective(); }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ) : "ADD DEFENSE"}
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start hover:bg-[#C2E1F4] hover:text-black transition-colors"
          onClick={() => setShowNavigationObjectiveSelector(true)}
        >
          {selectedNavigationObjective ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#C2E1F4] mr-2"></div>
                {selectedNavigationObjective.name}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleRemoveNavigationObjective(); }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ) : "ADD NAVIGATION"}
        </Button>
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
          selectedSquadrons={selectedSquadrons}
          uniqueClassNames={uniqueClassNames}
        />
      )}

      {showAssaultObjectiveSelector && (
        <ObjectiveSelector
          type="assault"
          onSelectObjective={handleSelectAssaultObjective}
          onClose={() => setShowAssaultObjectiveSelector(false)}
        />
      )}

      {showDefenseObjectiveSelector && (
        <ObjectiveSelector
          type="defense"
          onSelectObjective={handleSelectDefenseObjective}
          onClose={() => setShowDefenseObjectiveSelector(false)}
        />
      )}

      {showNavigationObjectiveSelector && (
        <ObjectiveSelector
          type="navigation"
          onSelectObjective={handleSelectNavigationObjective}
          onClose={() => setShowNavigationObjectiveSelector(false)}
        />
      )}

      {showUpgradeSelector && (
        <UpgradeSelector
          upgradeType={currentUpgradeType}
          faction={faction}
          onSelectUpgrade={handleSelectUpgrade}
          onClose={() => setShowUpgradeSelector(false)}
          selectedUpgrades={selectedShips.flatMap(ship => ship.assignedUpgrades).filter((upgrade): upgrade is Upgrade => typeof upgrade !== 'string')}
          uniqueClassNames={[]} // You'll need to implement this
          shipType={selectedShips.find(ship => ship.id === currentShipId)?.name}
          isCommander={currentUpgradeType === 'commander'}
        />
      )}
    </div>
  );
}