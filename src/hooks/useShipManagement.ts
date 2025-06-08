import { useState, useCallback } from 'react';
import { Ship, ContentSource } from '../types/fleet';
import { ShipModel } from '../components/ShipSelector';
import { generateUniqueShipId, fetchShip, getAliasKey } from '../utils/dataFetchers';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';

export const useShipManagement = () => {
  const [selectedShips, setSelectedShips] = useState<Ship[]>([]);
  const { addUniqueClassName, removeUniqueClassName } = useUniqueClassContext();

  const handleSelectShip = useCallback((ship: ShipModel) => {
    const newShip: Ship = {
      ...ship,
      id: generateUniqueShipId(),
      availableUpgrades: [...(ship.upgrades || [])], // Create new array
      assignedUpgrades: [],
      chassis: ship.chassis,
      size: ship.size || "",
      traits: ship.traits || [],
      source: ship.source || "regular",
      // ShipModel already includes speed, tokens, and armament with the correct types
    };
    setSelectedShips(prev => [...prev, newShip]);
    return newShip;
  }, []);

  const handleRemoveShip = useCallback((id: string) => {
    const shipToRemove = selectedShips.find((ship) => ship.id === id);
    if (shipToRemove) {
      // Remove unique class names for the ship and its upgrades
      if (shipToRemove.unique) {
        removeUniqueClassName(shipToRemove.name);
      }
      shipToRemove.assignedUpgrades.forEach((upgrade) => {
        if (upgrade.unique) {
          removeUniqueClassName(upgrade.name);
        }
        if (upgrade["unique-class"]) {
          upgrade["unique-class"].forEach((uc) => removeUniqueClassName(uc));
        }
      });

      setSelectedShips(prev => prev.filter((ship) => ship.id !== id));
      return shipToRemove;
    }
    return null;
  }, [selectedShips, removeUniqueClassName]);

  const handleCopyShip = useCallback((shipToCopy: Ship) => {
    if (shipToCopy.unique) {
      alert("Unique ships cannot be copied.");
      return null;
    }
  
    // Load aliases from localStorage
    const aliases = JSON.parse(localStorage.getItem("aliases") || "{}");
    
    // Format the ship name with source tag if needed
    const shipNameWithSource = shipToCopy.source && shipToCopy.source !== "regular" && shipToCopy.source !== "amg"
      ? `${shipToCopy.name} [${
          shipToCopy.source === 'legacyBeta' ? 'LegacyBeta' : 
          shipToCopy.source === 'legacy' ? 'Legacy' : 
          shipToCopy.source === 'legends' ? 'Legends' : 
          shipToCopy.source === 'arc' ? 'ARC' : 
          shipToCopy.source === 'nexus' ? 'Nexus' : ''
        }]`
      : shipToCopy.name;
    
    // Get the ship's alias key with the properly formatted name
    const shipKey = getAliasKey(aliases, `${shipNameWithSource} (${shipToCopy.points})`);
    
    if (!shipKey) {
      console.error("Could not find ship in aliases");
      return null;
    }
  
    // Fetch a fresh copy of the ship
    const freshShipModel = fetchShip(shipKey);
    if (!freshShipModel) {
      console.error("Could not fetch ship model");
      return null;
    }
  
    // Create new ship with fresh upgrade slots
    const newShip: Ship = {
      ...freshShipModel,
      id: Date.now().toString(),
      assignedUpgrades: [],
      availableUpgrades: freshShipModel.upgrades || [],
      size: freshShipModel.size || "unknown",
      searchableText: freshShipModel.searchableText || "",
      source: shipToCopy.source,
      chassis: freshShipModel.chassis
    };
  
    setSelectedShips(prev => [...prev, newShip]);
    return newShip;
  }, []);

  const handleMoveShip = useCallback((id: string, direction: 'up' | 'down') => {
    setSelectedShips(prevShips => {
      const index = prevShips.findIndex(ship => ship.id === id);
      if (index === -1) return prevShips;
      
      const newShips = [...prevShips];
      if (direction === 'up' && index > 0) {
        [newShips[index - 1], newShips[index]] = [newShips[index], newShips[index - 1]];
      } else if (direction === 'down' && index < newShips.length - 1) {
        [newShips[index], newShips[index + 1]] = [newShips[index + 1], newShips[index]];
      }
      return newShips;
    });
  }, []);

  const clearAllShips = useCallback(() => {
    selectedShips.forEach((ship) => {
      if (ship.unique) {
        removeUniqueClassName(ship.name);
      }
      ship.assignedUpgrades.forEach((upgrade) => {
        if (upgrade.unique) {
          removeUniqueClassName(upgrade.name);
        }
        if (upgrade["unique-class"]) {
          upgrade["unique-class"].forEach((uc) => removeUniqueClassName(uc));
        }
      });
    });

    setSelectedShips([]);
  }, [selectedShips, removeUniqueClassName]);

  const updateShip = useCallback((id: string, updater: (ship: Ship) => Ship) => {
    setSelectedShips(prev => prev.map(ship => ship.id === id ? updater(ship) : ship));
  }, []);

  return {
    selectedShips,
    setSelectedShips,
    handleSelectShip,
    handleRemoveShip,
    handleCopyShip,
    handleMoveShip,
    clearAllShips,
    updateShip
  };
}; 