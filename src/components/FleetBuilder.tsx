/* eslint-disable @typescript-eslint/no-empty-interface */

import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, ArrowLeft, FileText, Trash2, TriangleAlert } from 'lucide-react';
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
import { ExportTextPopup } from './ExportTextPopup';
import { factionLogos } from '../pages/[faction]';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SwipeableObjective } from './SwipeableObjective';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";


export interface Ship {
  id: string;
  name: string;
  points: number;
  cardimage: string;
  faction: string;
  availableUpgrades: string[];
  assignedUpgrades: Upgrade[];
  unique: boolean;
  chassis: string;
  size: string;
  traits?: string[];
  type: 'regular' | 'legacy' | 'legends';
  searchableText: string;
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
  abilities: Record<string, boolean | number>;
  tokens: {
    def_scatter?: number;
    def_evade?: number;
    def_brace?: number;
  };
  armament: {
    'anti-squadron': [number, number, number],
    'anti-ship': [number, number, number]
  };
  ace: boolean;
  'unique-class': string[];
  type: 'regular' | 'legacy' | 'legends';
  searchableText: string;
}

export interface Upgrade {
  id: string;
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
  modification?: boolean;
  slotIndex?: number;
  restrictions?: {
    disable_upgrades?: string[];
    enable_upgrades?: string[];
    disqual_upgrades?: string[];
    size?: string[];
    traits?: string[];
  };
  exhaust?: {
    type: 'blank' | 'recur' | 'nonrecur';
    ready_token?: string[];
    ready_amount?: number;
  };
  searchableText: string;
}

export interface Ship extends ShipModel {
  id: string;
  availableUpgrades: string[];
  assignedUpgrades: Upgrade[];
  searchableText: string;
}

const SectionHeader = ({ title, points, previousPoints, onClearAll, onAdd }: { title: string; points: number; previousPoints: number; show: boolean; onClearAll: () => void; onAdd: () => void }) => (
  <Card className="mb-4 relative">
    <Button 
      className="w-full justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30"
      variant="outline" 
      onClick={onAdd}
    >
      <span className="flex items-center">
        ADD {title.toUpperCase()}
      </span>
      <span className="flex items-center">
        <button onClick={(e) => { e.stopPropagation(); onClearAll(); }} className="mr-2 text-red-500 hover:text-red-700">
          <Trash2 size={16} />
        </button>
        <PointsDisplay points={points} previousPoints={previousPoints} />
      </span>
    </Button>
  </Card>
);

export default function FleetBuilder({ faction, fleetName, tournamentMode }: { faction: string; factionColor: string; fleetName: string; setFleetName: React.Dispatch<React.SetStateAction<string>>; tournamentMode: boolean; setTournamentMode: React.Dispatch<React.SetStateAction<boolean>> }) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uniqueClassNames, setUniqueClassNames] = useState<string[]>([]);
  const [showUpgradeSelector, setShowUpgradeSelector] = useState(false);
  const [currentUpgradeType, setCurrentUpgradeType] = useState('');
  const [currentShipId, setCurrentShipId] = useState('');
  const [showExportPopup, setShowExportPopup] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { addUniqueClassName, removeUniqueClassName } = useUniqueClassContext();
  const [currentUpgradeIndex, setCurrentUpgradeIndex] = useState<number>(0);
  const [disabledUpgrades, setDisabledUpgrades] = useState<Record<string, string[]>>({});
  const [enabledUpgrades, setEnabledUpgrades] = useState<Record<string, string[]>>({});
  const [filledSlots, setFilledSlots] = useState<Record<string, Record<string, number[]>>>({});
  const [hasCommander, setHasCommander] = useState(false);
  const [squadronToSwap, setSquadronToSwap] = useState<string | null>(null);
  const [tournamentViolations, setTournamentViolations] = useState<string[]>([]);

  const checkTournamentViolations = useCallback(() => {
    const violations: string[] = [];

    if (points > 400) {
      violations.push("Fleet exceeds 400 point limit");
    }

    if (totalSquadronPoints > 134) {
      violations.push("Squadrons exceed 134 point limit");
    }

    const flotillaCount = selectedShips.filter(ship => ship.traits?.includes("flotilla")).length;
    if (flotillaCount > 2) {
      violations.push("More than two flotillas in fleet");
    }

    const aceSquadronCount = selectedSquadrons.filter(squadron => squadron.ace === true).length;
    if (aceSquadronCount > 4) {
      violations.push("More than four aces in fleet");
    }

    if (!selectedAssaultObjective || !selectedDefenseObjective || !selectedNavigationObjective) {
      violations.push("Missing objective card(s)");
    }

    const commanderCount = selectedShips.flatMap(ship => ship.assignedUpgrades).filter(upgrade => upgrade.type === "commander").length;
    if (commanderCount !== 1) {
      violations.push("One commander upgrade is required");
    }

    setTournamentViolations(violations);
  }, [points, totalSquadronPoints, selectedShips, selectedSquadrons, selectedAssaultObjective, selectedDefenseObjective, selectedNavigationObjective]);

  useEffect(() => {
    if (tournamentMode) {
      checkTournamentViolations();
    }
  }, [tournamentMode, checkTournamentViolations]);

  const handleAddShip = () => {
    setShowShipSelector(true);
  };

  const handleSelectShip = (ship: ShipModel) => {
    const newShip: Ship = { 
      ...ship, 
      id: Date.now().toString(),
      availableUpgrades: ship.upgrades || [],
      assignedUpgrades: [],
      chassis: ship.chassis,
      size: ship.size || '',
      traits: ship.traits || [],
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
      
      // Check if the ship had a commander upgrade
      const hadCommander = shipToRemove.assignedUpgrades.some(upgrade => upgrade.type === 'commander');
      
      // Remove unique class names for the ship and its upgrades
      if (shipToRemove.unique) {
        removeUniqueClassName(shipToRemove.name);
      }
      shipToRemove.assignedUpgrades.forEach(upgrade => {
        if (upgrade.unique) {
          removeUniqueClassName(upgrade.name);
        }
        if (upgrade["unique-class"]) {
          upgrade["unique-class"].forEach(uc => removeUniqueClassName(uc));
        }
      });
  
      setSelectedShips(selectedShips.filter(ship => ship.id !== id));
      setPreviousPoints(points);
      setPreviousShipPoints(totalShipPoints);
      const newPoints = points - shipPoints;
      setPoints(newPoints);
      setTotalShipPoints(totalShipPoints - shipPoints);
  
      // Clear disabled and enabled upgrades for the removed ship
      setDisabledUpgrades(prev => {
        const newDisabled = {...prev};
        delete newDisabled[id];
        return newDisabled;
      });
      setEnabledUpgrades(prev => {
        const newEnabled = {...prev};
        delete newEnabled[id];
        return newEnabled;
      });
  
      // Set hasCommander to false if the removed ship had a commander
      if (hadCommander) {
        setHasCommander(false);
      }
    }
  };

  const handleUpgradeClick = (shipId: string, upgradeType: string, upgradeIndex: number) => {
    const ship = selectedShips.find(s => s.id === shipId);
    if (ship) {
      setCurrentShipId(shipId);
      setCurrentUpgradeType(upgradeType);
      setCurrentUpgradeIndex(upgradeIndex);
      setShowUpgradeSelector(true);
    }
  };
  
  const handleSelectUpgrade = (upgrade: Upgrade) => {
    // if (upgrade.type === 'commander' && hasCommander) {
    //   alert("Only one commander is allowed per fleet.");
    //   return;
    // }

    let totalPointDifference = 0;

    setSelectedShips(prevShips => 
      prevShips.map(ship => {
        if (ship.id === currentShipId) {
          const newUpgrade = { ...upgrade, slotIndex: currentUpgradeIndex };
          const updatedAssignedUpgrades = [...ship.assignedUpgrades];
          const existingUpgradeIndex = updatedAssignedUpgrades.findIndex(u => u.type === currentUpgradeType && u.slotIndex === currentUpgradeIndex);

          let pointDifference = upgrade.points;

          // Remove old upgrade if it exists
          if (existingUpgradeIndex !== -1) {
            const oldUpgrade = updatedAssignedUpgrades[existingUpgradeIndex];
            if (oldUpgrade.unique) {
              removeUniqueClassName(oldUpgrade.name);
            }
            if (oldUpgrade["unique-class"]) {
              oldUpgrade["unique-class"].forEach(uc => removeUniqueClassName(uc));
            }
            pointDifference = upgrade.points - oldUpgrade.points;
            updatedAssignedUpgrades[existingUpgradeIndex] = newUpgrade;
          } else {
            updatedAssignedUpgrades.push(newUpgrade);
          }

          totalPointDifference += pointDifference;

          // Add new unique class
          if (upgrade.unique) {
            addUniqueClassName(upgrade.name);
          }
          if (upgrade["unique-class"]) {
            upgrade["unique-class"].forEach(uc => addUniqueClassName(uc));
          }

          // Handle disabled upgrades
          const newDisabledUpgrades = [...(disabledUpgrades[ship.id] || [])];
          if (upgrade.restrictions?.disable_upgrades) {
            newDisabledUpgrades.push(...upgrade.restrictions.disable_upgrades);
          }
          if (upgrade.type === 'title') {
            newDisabledUpgrades.push('title');
          }
          setDisabledUpgrades({...disabledUpgrades, [ship.id]: newDisabledUpgrades});

          // Handle enabled upgrades
          const newEnabledUpgrades = [...(enabledUpgrades[ship.id] || [])];
          if (upgrade.restrictions?.enable_upgrades) {
            upgrade.restrictions.enable_upgrades
              .filter(enabledUpgrade => enabledUpgrade.trim() !== '')
              .forEach(enabledUpgrade => {
                if (!newEnabledUpgrades.includes(enabledUpgrade)) {
                  newEnabledUpgrades.push(enabledUpgrade);
                }
              });
          }
          setEnabledUpgrades({...enabledUpgrades, [ship.id]: newEnabledUpgrades});

          // Update filledSlots
          setFilledSlots(prevFilledSlots => {
            const shipSlots = prevFilledSlots[ship.id] || {};
            const upgradeTypeSlots = shipSlots[currentUpgradeType] || [];
            const updatedSlots = upgradeTypeSlots.includes(currentUpgradeIndex)
              ? upgradeTypeSlots
              : [...upgradeTypeSlots, currentUpgradeIndex];
            return {
              ...prevFilledSlots,
              [ship.id]: {
                ...shipSlots,
                [currentUpgradeType]: updatedSlots
              }
            };
          });

          if (upgrade.type === 'weapons-team-offensive-retro') {
            const weaponsTeamIndex = ship.availableUpgrades.indexOf('weapons-team');
            const offensiveRetroIndex = ship.availableUpgrades.indexOf('offensive-retro');
            setFilledSlots(prevFilledSlots => ({
              ...prevFilledSlots,
              [ship.id]: {
                ...prevFilledSlots[ship.id],
                'weapons-team': [...(prevFilledSlots[ship.id]?.['weapons-team'] || []), weaponsTeamIndex],
                'offensive-retro': [...(prevFilledSlots[ship.id]?.['offensive-retro'] || []), offensiveRetroIndex],
                'weapons-team-offensive-retro': [...(prevFilledSlots[ship.id]?.['weapons-team-offensive-retro'] || []), currentUpgradeIndex]
              }
            }));
          }

          return { ...ship, assignedUpgrades: updatedAssignedUpgrades };
        }
        return ship;
      })
    );

    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPoints(prevPoints => prevPoints + totalPointDifference);
    setTotalShipPoints(prevTotal => prevTotal + totalPointDifference);

    if (upgrade.type === 'commander') {
      setHasCommander(true);
    }

    setShowUpgradeSelector(false);
  };

  
  const handleRemoveUpgrade = useCallback((shipId: string, upgradeType: string, upgradeIndex: number) => {
    const shipToUpdate = selectedShips.find(ship => ship.id === shipId);
    const upgradeToRemove = shipToUpdate?.assignedUpgrades.find(u => u.type === upgradeType && u.slotIndex === upgradeIndex);
  
    if (upgradeToRemove && upgradeToRemove.type === 'commander') {
      setHasCommander(false);
    }
  
    console.log('Before removal:', selectedShips);
    setSelectedShips(prevShips => 
      prevShips.map(ship => {
        if (ship.id === shipId) {
          const upgradeToRemove = ship.assignedUpgrades.find(u => u.type === upgradeType && u.slotIndex === upgradeIndex);
          if (upgradeToRemove) {
            console.log('Removing upgrade:', upgradeToRemove);
            
            let upgradesToRemove = [upgradeToRemove];
            let pointsToRemove = upgradeToRemove.points;
  
            // Check for enabled upgrades
            if (upgradeToRemove.restrictions?.enable_upgrades) {
              const enabledUpgradesToRemove = ship.assignedUpgrades.filter(u => 
                upgradeToRemove.restrictions?.enable_upgrades?.includes(u.type)
              );
              upgradesToRemove = [...enabledUpgradesToRemove, upgradeToRemove];
              pointsToRemove += enabledUpgradesToRemove.reduce((sum, u) => sum + u.points, 0);
            }
  
            // Process all upgrades to remove
            upgradesToRemove.forEach(upgrade => {
              // Remove unique class with setTimeout
              if (upgrade.unique) {
                setTimeout(() => removeUniqueClassName(upgrade.name), 0);
              }
              if (upgrade["unique-class"]) {
                upgrade["unique-class"].forEach(uc => {
                  setTimeout(() => removeUniqueClassName(uc), 0);
                });
              }
  
              // Update disabled upgrades
              setDisabledUpgrades(prev => ({
                ...prev,
                [shipId]: (prev[shipId] || []).filter(u => !upgrade.restrictions?.disable_upgrades?.includes(u))
              }));
  
              // Update enabled upgrades
              setEnabledUpgrades(prev => ({
                ...prev,
                [shipId]: (prev[shipId] || []).filter(u => !upgrade.restrictions?.enable_upgrades?.includes(u))
              }));
  
              // If it's a title, remove the 'title' from disabled upgrades
              if (upgrade.type === 'title') {
                setDisabledUpgrades(prev => ({
                  ...prev,
                  [shipId]: (prev[shipId] || []).filter(u => u !== 'title')
                }));
              }
  
              // Update filledSlots
              setFilledSlots(prevFilledSlots => {
                const shipSlots = prevFilledSlots[shipId] || {};
                const upgradeTypeSlots = [...(shipSlots[upgrade.type] || [])];
                const updatedSlots = upgradeTypeSlots.filter(slot => slot !== upgrade.slotIndex);
                
                if (upgrade.type === 'weapons-team-offensive-retro') {
                  const weaponsTeamSlots = [...(shipSlots['weapons-team'] || [])];
                  const offensiveRetroSlots = [...(shipSlots['offensive-retro'] || [])];
                  return {
                    ...prevFilledSlots,
                    [shipId]: {
                      ...shipSlots,
                      'weapons-team': weaponsTeamSlots.filter(slot => slot !== upgrade.slotIndex),
                      'offensive-retro': offensiveRetroSlots.filter(slot => slot !== upgrade.slotIndex),
                      [upgrade.type]: updatedSlots
                    }
                  };
                } else {
                  return {
                    ...prevFilledSlots,
                    [shipId]: {
                      ...shipSlots,
                      [upgrade.type]: updatedSlots
                    }
                  };
                }
              });
            });
  
            setPreviousPoints(points);
            setPreviousShipPoints(totalShipPoints);
            setPoints(prevPoints => prevPoints - pointsToRemove);
            setTotalShipPoints(prevTotal => prevTotal - pointsToRemove);
  
            return {
              ...ship,
              points: ship.points,  // Keep the ship's base points unchanged
              assignedUpgrades: ship.assignedUpgrades.filter(u => 
                !upgradesToRemove.includes(u)
              )
            };
          }
        }
        return ship;
      })
    );
    console.log('After removal:', selectedShips);
  }, [points, removeUniqueClassName, totalShipPoints, selectedShips, setSelectedShips, setPreviousPoints, setPoints, setTotalShipPoints, setHasCommander]);


  const handleCopyShip = (shipToCopy: Ship) => {
    if (shipToCopy.unique) {
      alert("Unique ships cannot be copied.");
      return;
    }

    const newShip: Ship = { 
      ...shipToCopy, 
      id: Date.now().toString(),
      assignedUpgrades: [],
      availableUpgrades: [...shipToCopy.availableUpgrades]
    };

    let pointsToAdd = shipToCopy.points;

    // Filter out unique upgrades and upgrades that add slots
    shipToCopy.assignedUpgrades.forEach(upgrade => {
      if (!upgrade.unique && !upgrade.restrictions?.enable_upgrades) {
        newShip.assignedUpgrades.push({ ...upgrade });
        pointsToAdd += upgrade.points;
      } else if (upgrade.restrictions?.enable_upgrades) {
        // Remove the enabled upgrade slots from availableUpgrades
        newShip.availableUpgrades = newShip.availableUpgrades.filter(
          slot => !upgrade.restrictions?.enable_upgrades?.includes(slot)
        );
        // Use handleRemoveUpgrade for the upgrades we're filtering out
        handleRemoveUpgrade(newShip.id, upgrade.type, upgrade.slotIndex || 0);
      }
    });

    setSelectedShips(prevShips => [...prevShips, newShip]);
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPoints(prevPoints => prevPoints + pointsToAdd);
    setTotalShipPoints(prevTotal => prevTotal + pointsToAdd);
  };

  const handleAddSquadron = () => {
    setShowSquadronSelector(true);
  };

  const handleSelectSquadron = (squadron: Squadron) => {
    if (squadronToSwap) {
      setSelectedSquadrons(prevSquadrons => 
        prevSquadrons.map(s => {
          if (s.id === squadronToSwap) {
            // Remove unique class names from the old squadron
            if (s.unique) {
              removeUniqueClassName(s.name);
            }
            if (s['unique-class']) {
              s['unique-class'].forEach(uc => removeUniqueClassName(uc));
            }

            const pointDifference = squadron.points - s.points;
            setPreviousPoints(points);
            setPreviousSquadronPoints(totalSquadronPoints);
            setPoints(prevPoints => prevPoints + pointDifference);
            setTotalSquadronPoints(prevTotal => prevTotal + pointDifference);

            // Add unique class names for the new squadron
            if (squadron.unique) {
              addUniqueClassName(squadron.name);
            }
            if (squadron['unique-class']) {
              squadron['unique-class'].forEach(uc => addUniqueClassName(uc));
            }

            return { ...squadron, id: Date.now().toString(), count: 1 };
          }
          return s;
        })
      );
      setSquadronToSwap(null);
    } else {
      const newSquadron: Squadron = { 
        ...squadron, 
        id: Date.now().toString(),
        count: 1,
      };
      setSelectedSquadrons(prevSquadrons => [...prevSquadrons, newSquadron]);
      setPreviousPoints(points);
      setPreviousSquadronPoints(totalSquadronPoints);
      const newPoints = points + squadron.points;
      setPoints(newPoints);
      setTotalSquadronPoints(totalSquadronPoints + squadron.points);

      // Add unique class names for the new squadron
      if (squadron.unique) {
        addUniqueClassName(squadron.name);
      }
      if (squadron['unique-class']) {
        squadron['unique-class'].forEach(uc => addUniqueClassName(uc));
      }
    }
    setShowSquadronSelector(false);
  };


  const handleRemoveSquadron = (id: string) => {
    const squadronToRemove = selectedSquadrons.find(squadron => squadron.id === id);
    if (squadronToRemove) {
      if (squadronToRemove.unique) {
        removeUniqueClassName(squadronToRemove.name);
        if (squadronToRemove['ace-name']) {
          removeUniqueClassName(squadronToRemove['ace-name']);
        }
      }
      if (squadronToRemove['unique-class']) {
        squadronToRemove['unique-class'].forEach(uc => removeUniqueClassName(uc));
      }
  
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
    setSelectedSquadrons(prevSquadrons => {
      return prevSquadrons.reduce((acc, squadron) => {
        if (squadron.id === id) {
          const newCount = (squadron.count || 1) - 1;
          if (newCount === 0) {
            // Squadron will be removed
            setPreviousPoints(points);
            setPreviousSquadronPoints(totalSquadronPoints);
            const newPoints = points - squadron.points;
            setPoints(newPoints);
            setTotalSquadronPoints(totalSquadronPoints - squadron.points);
  
            // Remove unique class names if it's the last squadron
            if (squadron.unique) {
              removeUniqueClassName(squadron.name);
            }
            if (squadron['unique-class']) {
              squadron['unique-class'].forEach(uc => removeUniqueClassName(uc));
            }
            // Don't add this squadron to the accumulator
            return acc;
          } else {
            // Squadron count is decremented
            setPreviousPoints(points);
            setPreviousSquadronPoints(totalSquadronPoints);
            const newPoints = points - squadron.points;
            setPoints(newPoints);
            setTotalSquadronPoints(totalSquadronPoints - squadron.points);
            return [...acc, { ...squadron, count: newCount }];
          }
        }
        return [...acc, squadron];
      }, [] as Squadron[]);
    });
  };

  const handleSwapSquadron = (id: string) => {
    setShowSquadronSelector(true);
    setSquadronToSwap(id);
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

  const clearAllShips = () => {
    selectedShips.forEach(ship => {
      if (ship.unique) {
        removeUniqueClassName(ship.name);
      }
      ship.assignedUpgrades.forEach(upgrade => {
        if (upgrade.unique) {
          removeUniqueClassName(upgrade.name);
        }
        if (upgrade["unique-class"]) {
          upgrade["unique-class"].forEach(uc => removeUniqueClassName(uc));
        }
      });
    });
  
    setSelectedShips([]);
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    const newPoints = points - totalShipPoints;
    setPoints(newPoints);
    setTotalShipPoints(0);
    setHasCommander(false);  // Add this line
  };
  
  const clearAllSquadrons = () => {
    selectedSquadrons.forEach(squadron => {
      if (squadron.unique) {
        removeUniqueClassName(squadron.name);
      }
      if (squadron['unique-class']) {
        squadron['unique-class'].forEach(uc => removeUniqueClassName(uc));
      }
    });
  
    setPreviousPoints(points);
    setPreviousSquadronPoints(totalSquadronPoints);
    setPoints(points - totalSquadronPoints);
    setTotalSquadronPoints(0);
    setSelectedSquadrons([]);
  };

  const generateExportText = () => {
    let text = `Name: ${fleetName}\n`;
    text += `Faction: ${faction.charAt(0).toUpperCase() + faction.slice(1)}\n`;
    
    const commander = selectedShips.flatMap(ship => ship.assignedUpgrades).find(upgrade => upgrade.type === 'commander');
    if (commander) {
      text += `Commander: ${commander.name}\n`;
    }
    
    text += `\n`;
    if (selectedAssaultObjective) {
      text += `Assault: ${selectedAssaultObjective.name}\n`;
    }
    if (selectedDefenseObjective) {
      text += `Defense: ${selectedDefenseObjective.name}\n`;
    }
    if (selectedNavigationObjective) {
      text += `Navigation: ${selectedNavigationObjective.name}\n`;
    }
    
    if (selectedShips.length > 0) {
      text += `\n`;
      selectedShips.forEach(ship => {
        text += `${ship.name} (${ship.points})\n`;
        ship.assignedUpgrades.forEach(upgrade => {
          text += `• ${upgrade.name} (${upgrade.points})\n`;
        });
        text += `= ${ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0)} Points\n\n`;
      });
    }
    
    text += `Squadrons:\n`;
    if (selectedSquadrons.length > 0) {
      const groupedSquadrons = selectedSquadrons.reduce((acc, squadron) => {
        const key = squadron.unique || squadron['ace-name'] 
          ? `${squadron['ace-name'] || squadron.name} (${squadron.points})`
          : `${squadron.name} (${squadron.points * (squadron.count || 1)})`; // Multiply points by count for non-unique
        if (!acc[key]) {
          acc[key] = { count: 0, isUnique: squadron.unique || !!squadron['ace-name'], points: squadron.points };
        }
        acc[key].count += squadron.count || 1;
        return acc;
      }, {} as Record<string, { count: number, isUnique: boolean, points: number }>);

      Object.entries(groupedSquadrons).forEach(([squadronKey, { count, isUnique }]) => {
        if (isUnique) {
          text += `• ${squadronKey}\n`;
        } else {
          text += `• ${count} x ${squadronKey}\n`; // Points are already included in the key
        }
      });
    }
    text += `= ${totalSquadronPoints} Points\n\n`;
    
    text += `Total Points: ${points}`;
    
    return text;
  };

  // Generate import text

  const handlePrint = () => {
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrintContent = () => {
    const factionLogo = factionLogos[faction as keyof typeof factionLogos];
    
    const content = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fleetName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        
        body {
        font-family: 'Roboto', sans-serif;
        line-height: 1.5;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
        background-color: #f9f9f9;
        }

        .header {
        display: grid;
        grid-template-columns: 1fr 40px 1fr;
        align-items: center;
        gap: 20px;
        margin-bottom: 1.25em;
        }

        .fleet-name {
        font-size: 28px;
        font-weight: bold;
        text-align: right;
        }

        .total-points {
        font-size: 28px;
        font-weight: bold;
        text-align: left;
        }

        .logo {
        width: 40px;
        height: 40px;
        object-fit: contain;
        }

        .grid {
        border-top: 1px solid #ddd;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1em;
        padding-top: 1.5em;
        margin-bottom: 1.5em;
        }

        .section {
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1em;
        }

        .ship, .squadron {
        margin-bottom: 12px;
        }

        .upgrade {
        margin-left: 1em;
        font-size: 14px;
        color: #555;
        }

        .objectives {
        display: flex;
        justify-content: space-between;
        gap: 1em;
        margin-top: 1.5em;
        border-top: 1px solid #ddd;
        padding-top: 1.5em;
        }

        .objective-card {
        flex: 1;
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: .5em;
        padding: .5em;
        text-align: center;
        }

        .objective-card h4 {
        margin: 0px;
        font-size: 18px;
        font-weight: bold;
        }

        .objective-card p {
        margin: 0;
        font-size: 1em;
        color: #666;
        }
    </style>
    </head>
    <body>
    <div class="header">
        <div class="fleet-name">${fleetName}</div>
        <img src="${factionLogo}" alt="Faction logo" class="logo">
        <div class="total-points">${points} points</div>
    </div>

    <div class="grid">
        ${selectedShips.map(ship => `
        <div class="section">
            <strong>${ship.name}</strong> (${ship.points} points)
            ${ship.assignedUpgrades.map(upgrade => `
            <div class="upgrade">
                <div style="display: flex; align-items: center; gap: 0.25em;"><img src="/icons/${upgrade.type}.svg" style="width: 16px; height: 16px;"/> ${upgrade.name} (${upgrade.points} points)</div>
            </div>
            `).join('')}
            <div><strong>Total:</strong> ${ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0)} points</div>
        </div>
        `).join('')}
    </div>

    <div class="grid">
        ${selectedSquadrons.map(squadron => `
        <div class="section">
            <strong>${squadron['ace-name'] || squadron.name}</strong> (${squadron.points} points)${squadron.count > 1 ? ` x${squadron.count}` : ''}
        </div>
        `).join('')}
    </div>

    <div class="objectives">
        <div class="objective-card">
        <h4>Assault</h4>
        <p>${selectedAssaultObjective ? selectedAssaultObjective.name : 'None'}</p>
        </div>
        <div class="objective-card">
        <h4>Defense</h4>
        <p>${selectedDefenseObjective ? selectedDefenseObjective.name : 'None'}</p>
        </div>
        <div class="objective-card">
        <h4>Navigation</h4>
        <p>${selectedNavigationObjective ? selectedNavigationObjective.name : 'None'}</p>
        </div>
    </div>

    ${tournamentMode ? `
      <div class="tournament-info">
        <h3>Tournament Restrictions:</h3>
        ${tournamentViolations.length === 0 
          ? '<p>This list complies with tournament restrictions.</p>'
          : `
            <p>This list does not comply with tournament restrictions:</p>
            <ul>
              ${tournamentViolations.map(violation => `<li>${violation}</li>`).join('')}
            </ul>
          `
        }
      </div>
    ` : ''}

    </body>
    </html>`;
    
    return content;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
        <div className="mb-2 sm:mb-0 flex items-center justify-start space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setShowExportPopup(true)}>
            <FileText className="h-4 w-4" />
          </Button>
          {tournamentMode && tournamentViolations.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-yellow-500">
                  <TriangleAlert className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Tournament Violations:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    {tournamentViolations.map((violation, index) => (
                      <li key={index}>{violation}</li>
                    ))}
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex-grow" />
        <PointsDisplay points={points} previousPoints={previousPoints} />
      </div>
  
      {selectedShips.length > 0 ? (
        <SectionHeader 
          title="Ships" 
          points={totalShipPoints} 
          previousPoints={previousShipPoints} 
          show={true}
          onClearAll={clearAllShips}
          onAdd={handleAddShip}
        />
      ) : (
        <Card className="mb-4 relative">
          <Button 
            className="w-full justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30"
            variant="outline" 
            onClick={handleAddShip}
          >
            ADD SHIP
          </Button>
          {showFilter && <ShipFilter onApplyFilter={setShipFilter} onClose={() => setShowFilter(false)} />}
        </Card>
      )}
  
      <div className="mb-4">
        {selectedShips.map((ship) => (
          <SelectedShip
            key={ship.id}
            ship={ship}
            onRemove={handleRemoveShip}
            onUpgradeClick={handleUpgradeClick}
            onCopy={handleCopyShip}
            handleRemoveUpgrade={handleRemoveUpgrade}
            disabledUpgrades={disabledUpgrades[ship.id] || []}
            enabledUpgrades={enabledUpgrades[ship.id] || []}
            filledSlots={filledSlots[ship.id] || {}}
            hasCommander={hasCommander}
            traits={ship.traits || []}
          />
        ))}
      </div>
  
      {selectedSquadrons.length > 0 ? (
        <SectionHeader 
          title="Squadrons" 
          points={totalSquadronPoints} 
          previousPoints={previousSquadronPoints} 
          show={true}
          onClearAll={clearAllSquadrons}
          onAdd={handleAddSquadron}
        />
      ) : (
        <Card className="mb-4 relative">
          <Button 
            className="w-full justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30"
            variant="outline" 
            onClick={handleAddSquadron}
          >
            ADD SQUADRON
          </Button>
          {showFilter && <SquadronFilter onApplyFilter={setSquadronFilter} onClose={() => setShowFilter(false)} />}
        </Card>
      )}
  
      <div className="mb-4">
      {selectedSquadrons.map((squadron) => (
        <SelectedSquadron
          key={squadron.id}
          squadron={squadron}
          onRemove={handleRemoveSquadron}
          onIncrement={handleIncrementSquadron}
          onDecrement={handleDecrementSquadron}
          onSwapSquadron={handleSwapSquadron}
        />
      ))}
      </div>


      <div className="space-y-2 mb-4">
      <SwipeableObjective
        type="assault"
        selectedObjective={selectedAssaultObjective}
        onRemove={handleRemoveAssaultObjective}
        onOpen={() => setShowAssaultObjectiveSelector(true)}
        color="#EB3F3A"
      />

      <SwipeableObjective
        type="defense"
        selectedObjective={selectedDefenseObjective}
        onRemove={handleRemoveDefenseObjective}
        onOpen={() => setShowDefenseObjectiveSelector(true)}
        color="#FAEE13"
      />

      <SwipeableObjective
        type="navigation"
        selectedObjective={selectedNavigationObjective}
        onRemove={handleRemoveNavigationObjective}
        onOpen={() => setShowNavigationObjectiveSelector(true)}
        color="#C2E1F4"
      />
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Link href="/">
          <Button variant="outline" className="flex-grow">
            <ArrowLeft className="mr-2 h-4 w-4" /> BACK
          </Button>
        </Link>
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
          id={currentShipId}
          upgradeType={currentUpgradeType}
          faction={faction}
          onSelectUpgrade={handleSelectUpgrade}
          onClose={() => setShowUpgradeSelector(false)}
          selectedUpgrades={selectedShips.flatMap(ship => ship.assignedUpgrades)}
          shipType={selectedShips.find(ship => ship.id === currentShipId)?.name}
          chassis={selectedShips.find(ship => ship.id === currentShipId)?.chassis}
          shipSize={selectedShips.find(ship => ship.id === currentShipId)?.size}
          shipTraits={selectedShips.find(ship => ship.id === currentShipId)?.traits}
          currentShipUpgrades={selectedShips.find(ship => ship.id === currentShipId)?.assignedUpgrades || []}
          disqualifiedUpgrades={disabledUpgrades[currentShipId] || []}
          disabledUpgrades={disabledUpgrades[currentShipId] || []}
        />
      )}

      {showExportPopup && (
        <ExportTextPopup
          text={generateExportText()}
          onClose={() => setShowExportPopup(false)}
        />
      )}



    </div>
  );
}

