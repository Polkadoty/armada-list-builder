import { useState, useCallback } from 'react';
import { Squadron } from '../types/fleet';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';

export const useSquadronManagement = () => {
  const [selectedSquadrons, setSelectedSquadrons] = useState<Squadron[]>([]);
  const [squadronIdCounter, setSquadronIdCounter] = useState(0);
  const { addUniqueClassName, removeUniqueClassName } = useUniqueClassContext();

  const generateUniqueSquadronId = useCallback((): string => {
    setSquadronIdCounter(prev => prev + 1);
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `squadron_${squadronIdCounter}_${randomPart}`;
  }, [squadronIdCounter]);

  const handleAddingSquadron = useCallback((squadron: Squadron) => {
    const squadronId = generateUniqueSquadronId();
    const newSquadron: Squadron = {
      ...squadron,
      id: squadronId,
      count: 1,
      source: squadron.source,
    };

    setSelectedSquadrons((prevSquadrons) => {
      if (!squadron.unique) {
        return [...prevSquadrons, newSquadron];
      }

      // Find where to insert the new unique squadron
      const uniqueSquadrons = prevSquadrons.filter(s => s.unique);
      const regularSquadrons = prevSquadrons.filter(s => !s.unique);
      
      const insertIndex = uniqueSquadrons.findIndex(s => {
        const currentName = s['ace-name'] || s.name;
        const newName = newSquadron['ace-name'] || newSquadron.name;
        return currentName.localeCompare(newName) > 0;
      });

      if (insertIndex === -1) {
        // Add to end of unique squadrons
        return [...uniqueSquadrons, newSquadron, ...regularSquadrons];
      }

      // Insert at the correct position
      return [
        ...uniqueSquadrons.slice(0, insertIndex),
        newSquadron,
        ...uniqueSquadrons.slice(insertIndex),
        ...regularSquadrons
      ];
    });

    // Add unique class names for the new squadron
    if (squadron.unique) {
      addUniqueClassName(squadron.name);
    }
    if (squadron["unique-class"]) {
      squadron["unique-class"].forEach((uc) => addUniqueClassName(uc));
    }
    
    return squadronId;
  }, [addUniqueClassName, generateUniqueSquadronId]);

  const handleRemoveSquadron = useCallback((id: string) => {
    const squadronToRemove = selectedSquadrons.find(
      (squadron) => squadron.id === id
    );
    if (squadronToRemove) {
      if (squadronToRemove.unique) {
        removeUniqueClassName(squadronToRemove.name);
        if (squadronToRemove["ace-name"]) {
          removeUniqueClassName(squadronToRemove["ace-name"]);
        }
      }
      if (squadronToRemove["unique-class"]) {
        squadronToRemove["unique-class"].forEach((uc) =>
          removeUniqueClassName(uc)
        );
      }

      setSelectedSquadrons(prev => prev.filter((squadron) => squadron.id !== id));
      return squadronToRemove;
    }
    return null;
  }, [selectedSquadrons, removeUniqueClassName]);

  const handleIncrementSquadron = useCallback((id: string) => {
    setSelectedSquadrons((squadrons) =>
      squadrons.map((squadron) =>
        squadron.id === id
          ? { ...squadron, count: (squadron.count || 1) + 1 }
          : squadron
      )
    );
    const squadron = selectedSquadrons.find((s) => s.id === id);
    return squadron;
  }, [selectedSquadrons]);

  const handleDecrementSquadron = useCallback((id: string) => {
    const squadronToDecrement = selectedSquadrons.find(s => s.id === id);
    
    setSelectedSquadrons((prevSquadrons) => {
      return prevSquadrons.reduce((acc, squadron) => {
        if (squadron.id === id) {
          const newCount = (squadron.count || 1) - 1;
          if (newCount === 0) {
            // Squadron will be removed - remove unique class names if it's the last squadron
            if (squadron.unique) {
              removeUniqueClassName(squadron.name);
            }
            if (squadron["unique-class"]) {
              squadron["unique-class"].forEach((uc) =>
                removeUniqueClassName(uc)
              );
            }
            // Don't add this squadron to the accumulator
            return acc;
          } else {
            // Squadron count is decremented
            return [...acc, { ...squadron, count: newCount }];
          }
        }
        return [...acc, squadron];
      }, [] as Squadron[]);
    });

    return squadronToDecrement;
  }, [selectedSquadrons, removeUniqueClassName]);

  const handleMoveSquadron = useCallback((id: string, direction: 'up' | 'down') => {
    setSelectedSquadrons(prevSquadrons => {
      const index = prevSquadrons.findIndex(squadron => squadron.id === id);
      if (index === -1) return prevSquadrons;
      
      const newSquadrons = [...prevSquadrons];
      if (direction === 'up' && index > 0) {
        [newSquadrons[index - 1], newSquadrons[index]] = [newSquadrons[index], newSquadrons[index - 1]];
      } else if (direction === 'down' && index < newSquadrons.length - 1) {
        [newSquadrons[index], newSquadrons[index + 1]] = [newSquadrons[index + 1], newSquadrons[index]];
      }
      return newSquadrons;
    });
  }, []);

  const clearAllSquadrons = useCallback(() => {
    selectedSquadrons.forEach((squadron) => {
      if (squadron.unique) {
        removeUniqueClassName(squadron.name);
      }
      if (squadron["unique-class"]) {
        squadron["unique-class"].forEach((uc) => removeUniqueClassName(uc));
      }
    });

    setSelectedSquadrons([]);
  }, [selectedSquadrons, removeUniqueClassName]);

  const handleSwapSquadron = useCallback((oldSquadron: Squadron, newSquadron: Squadron) => {
    setSelectedSquadrons((prevSquadrons) =>
      prevSquadrons.map((s) => {
        if (s.id === oldSquadron.id) {
          // Remove unique class names from the old squadron
          if (s.unique) {
            removeUniqueClassName(s.name);
          }
          if (s["unique-class"]) {
            s["unique-class"].forEach((uc) => removeUniqueClassName(uc));
          }

          // Add unique class names for the new squadron
          if (newSquadron.unique) {
            addUniqueClassName(newSquadron.name);
          }
          if (newSquadron["unique-class"]) {
            newSquadron["unique-class"].forEach((uc) => addUniqueClassName(uc));
          }

          return { ...newSquadron, id: generateUniqueSquadronId(), count: 1 };
        }
        return s;
      })
    );
  }, [removeUniqueClassName, addUniqueClassName, generateUniqueSquadronId]);

  return {
    selectedSquadrons,
    setSelectedSquadrons,
    handleAddingSquadron,
    handleRemoveSquadron,
    handleIncrementSquadron,
    handleDecrementSquadron,
    handleMoveSquadron,
    clearAllSquadrons,
    handleSwapSquadron
  };
}; 