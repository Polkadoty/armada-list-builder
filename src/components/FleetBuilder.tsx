/* eslint-disable @typescript-eslint/no-empty-interface */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Pencil, Filter, Printer, ArrowLeft, FileText, Trash2 } from 'lucide-react';
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
  modification?: boolean;
  slotIndex?: number;
  restrictions?: {
    disable_upgrades?: string[];
    enable_upgrades?: string[];
    disqual_upgrades?: string[];
  };
}

export interface Ship extends ShipModel {
  id: string;
  availableUpgrades: string[];
  assignedUpgrades: Upgrade[];
}

const SectionHeader = ({ title, points, previousPoints, show, onClearAll }: { title: string; points: number; previousPoints: number; show: boolean; onClearAll: () => void }) => (
  show ? (
    <div className="flex justify-between items-center mb-2 mt-4 border-b border-gray-300 relative">
      <div className="flex items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="flex items-center z-40">
        <button onClick={onClearAll} className="mr-2 text-red-500 hover:text-red-700">
          <Trash2 size={16} />
        </button>
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
      assignedUpgrades: [],
      chassis: ship.chassis || ship.name
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
            // Remove old unique class
            if (oldUpgrade.unique) {
              removeUniqueClassName(oldUpgrade.name);
            }
            if (oldUpgrade["unique-class"]) {
              oldUpgrade["unique-class"].forEach(uc => removeUniqueClassName(uc));
            }
            // Calculate point difference
            pointDifference = upgrade.points - oldUpgrade.points;
          }
  
          totalPointDifference += pointDifference;
  
          // Add new upgrade
          if (existingUpgradeIndex !== -1) {
            updatedAssignedUpgrades[existingUpgradeIndex] = newUpgrade;
          } else {
            updatedAssignedUpgrades.push(newUpgrade);
          }
  
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
  
          return { ...ship, assignedUpgrades: updatedAssignedUpgrades };
        }
        return ship;
      })
    );
  
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPoints(prevPoints => prevPoints + totalPointDifference);
    setTotalShipPoints(prevTotal => prevTotal + totalPointDifference);
    setShowUpgradeSelector(false);
  };
  
  const handleRemoveUpgrade = (shipId: string, upgradeType: string, upgradeIndex: number) => {
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
              // Remove unique class
              if (upgrade.unique) {
                removeUniqueClassName(upgrade.name);
              }
              if (upgrade["unique-class"]) {
                upgrade["unique-class"].forEach(uc => removeUniqueClassName(uc));
              }
  
              // Update disabled upgrades
              if (upgrade.restrictions?.disable_upgrades) {
                setDisabledUpgrades(prev => ({
                  ...prev,
                  [shipId]: (prev[shipId] || []).filter(u => !upgrade.restrictions?.disable_upgrades?.includes(u))
                }));
              }
  
              // Update enabled upgrades
              if (upgrade.restrictions?.enable_upgrades) {
                setEnabledUpgrades(prev => ({
                  ...prev,
                  [shipId]: (prev[shipId] || []).filter(u => !upgrade.restrictions?.enable_upgrades?.includes(u))
                }));
              }
  
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
                const upgradeTypeSlots = shipSlots[upgrade.type] || [];
                const updatedSlots = upgradeTypeSlots.filter(slot => slot !== upgrade.slotIndex);
                return {
                  ...prevFilledSlots,
                  [shipId]: {
                    ...shipSlots,
                    [upgrade.type]: updatedSlots
                  }
                };
              });
            });
  
            // Update points
            setPreviousPoints(points);
            setPreviousShipPoints(totalShipPoints);
            setPoints(prevPoints => prevPoints - pointsToRemove);
            setTotalShipPoints(prevTotal => prevTotal - pointsToRemove);
  
            return {
              ...ship,
              assignedUpgrades: ship.assignedUpgrades.filter(u => 
                !upgradesToRemove.some(ur => ur.type === u.type && ur.slotIndex === u.slotIndex)
              )
            };
          }
        }
        return ship;
      })
    );
    console.log('After removal:', selectedShips);
  };

  const handleCopyShip = (shipToCopy: Ship) => {
    const newShip = { 
      ...shipToCopy, 
      id: Date.now().toString(),
      assignedUpgrades: shipToCopy.assignedUpgrades.filter(upgrade => !upgrade.unique)
    };
    const newShipPoints = newShip.points + newShip.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0);
    setSelectedShips([...selectedShips, newShip]);
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    const newPoints = points + newShipPoints;
    setPoints(newPoints);
    setTotalShipPoints(totalShipPoints + newShipPoints);
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
      if (squadronToRemove.unique) {
        removeUniqueClassName(squadronToRemove.name);
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
        const key = `${squadron.name} (${squadron.points})`;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += squadron.count || 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(groupedSquadrons).forEach(([squadronKey, count]) => {
        text += ` - ${count} x ${squadronKey}\n`;
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
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .logo { width: 100px; height: 100px; }
          h1 { margin-bottom: 0; font-size: 24px; }
          h2 { margin-top: 0; color: #666; font-size: 18px; }
          .two-columns { 
            display: flex; 
            justify-content: space-between; 
          }
          .column { width: 48%; }
          .section { margin-top: 20px; }
          .ship, .squadron { margin-bottom: 10px; }
          .upgrade { margin-left: 20px; }
          .total { font-weight: bold; margin-top: 20px; }
          .objectives { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; }
        </style>
      </head>
      <body>
        <img src="${factionLogo}" alt="${faction} logo" class="logo">
        <h1>${fleetName}</h1>
        <h2>Faction: ${faction.charAt(0).toUpperCase() + faction.slice(1)}</h2>
        
        <div class="two-columns">
          <div class="column">
            <div class="section">
              <h3>Ships</h3>
              ${selectedShips.map(ship => `
                <div class="ship">
                  ${ship.name} (${ship.points})
                  ${ship.assignedUpgrades.map(upgrade => `
                    <div class="upgrade">• ${upgrade.name} (${upgrade.points})</div>
                  `).join('')}
                  = ${ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0)} Points
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="column">
            <div class="section">
              <h3>Squadrons</h3>
              ${selectedSquadrons.map(squadron => `
                <div class="squadron">• ${squadron.name} (${squadron.points})${squadron.count > 1 ? ` x${squadron.count}` : ''}</div>
              `).join('')}
              = ${totalSquadronPoints} Points
            </div>
          </div>
        </div>
        
        <div class="total">Total Fleet Points: ${points}</div>
        
        <div class="objectives">
          <h3>Objectives</h3>
          <p>Assault: ${selectedAssaultObjective ? selectedAssaultObjective.name : 'None'}</p>
          <p>Defense: ${selectedDefenseObjective ? selectedDefenseObjective.name : 'None'}</p>
          <p>Navigation: ${selectedNavigationObjective ? selectedNavigationObjective.name : 'None'}</p>
        </div>
      </body>
      </html>
    `;
    
    return content;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="mb-2 sm:mb-0 flex items-center">
          {isEditingName ? (
            <Input
              value={fleetName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className="text-xl font-bold"
              autoFocus
            />
          ) : (
            <div className="flex items-center cursor-pointer" onClick={handleNameClick}>
              <h2 className="text-xl font-bold mr-2">
                {fleetName}
              </h2>
              <Pencil className="h-4 w-4 text-gray-500" />
            </div>
          )}
        </div>
        <PointsDisplay points={points} previousPoints={previousPoints} />
      </div>

      <SectionHeader 
        title="Ships" 
        points={totalShipPoints} 
        previousPoints={previousShipPoints} 
        show={selectedShips.length > 0}
        onClearAll={clearAllShips}
      />
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
          />
        ))}
      </div>

      <SectionHeader 
        title="Squadrons" 
        points={totalSquadronPoints} 
        previousPoints={previousSquadronPoints} 
        show={selectedSquadrons.length > 0}
        onClearAll={clearAllSquadrons}
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
        <Button variant="outline" className="flex-grow" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> PRINT
        </Button>
        <Link href="/">
          <Button variant="outline" className="flex-grow">
            <ArrowLeft className="mr-2 h-4 w-4" /> BACK
          </Button>
        </Link>
        <Button variant="outline" className="flex-grow" onClick={() => setShowExportPopup(true)}>
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
          selectedUpgrades={selectedShips.flatMap(ship => ship.assignedUpgrades)}
          shipType={selectedShips.find(ship => ship.id === currentShipId)?.name}
          chassis={selectedShips.find(ship => ship.id === currentShipId)?.chassis}
          currentShipUpgrades={selectedShips.find(ship => ship.id === currentShipId)?.assignedUpgrades || []}
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