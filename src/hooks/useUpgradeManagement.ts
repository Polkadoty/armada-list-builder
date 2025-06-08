import { useState, useCallback } from 'react';
import { Ship, Upgrade, UpgradeState, ContentSource } from '../types/fleet';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';

export const useUpgradeManagement = () => {
  const [disabledUpgrades, setDisabledUpgrades] = useState<Record<string, string[]>>({});
  const [enabledUpgrades, setEnabledUpgrades] = useState<Record<string, string[]>>({});
  const [filledSlots, setFilledSlots] = useState<Record<string, Record<string, number[]>>>({});
  const [greyUpgrades, setGreyUpgrades] = useState<Record<string, string[]>>({});
  const { addUniqueClassName, removeUniqueClassName } = useUniqueClassContext();

  const handleAddUpgrade = useCallback((shipId: string, upgrade: Upgrade, ships: Ship[], updateShip: (id: string, updater: (ship: Ship) => Ship) => void) => {
    updateShip(shipId, (ship) => {
      const exhaustType = upgrade.exhaust?.type || "";
      const isModification = upgrade.modification ? "modification" : "";

      // Determine the source based on the alias
      let source: ContentSource = "regular";
      if (upgrade.alias) {
        if (upgrade.alias.includes("LegacyBeta")) {
          source = "legacyBeta";
        } else if (upgrade.alias.includes("Legacy")) {
          source = "legacy";
        } else if (upgrade.alias.includes("Legends")) {
          source = "legends";
        } else if (upgrade.alias.includes("ARC")) {
          source = "arc";
        } else if (upgrade.alias.includes("Nexus")) {
          source = "nexus";
        }
      }

      const newUpgrade: Upgrade = {
        ...upgrade,
        slotIndex: upgrade.slotIndex !== undefined ? upgrade.slotIndex : ship.assignedUpgrades.length,
        source: source,
        searchableText: JSON.stringify({
          ...upgrade,
          name: upgrade.name,
          ability: upgrade.ability,
          exhaustType: exhaustType,
          isModification: isModification,
        }).toLowerCase(),
      };

      const updatedAssignedUpgrades = [...ship.assignedUpgrades];
      const existingUpgradeIndex = updatedAssignedUpgrades.findIndex(
        (u) => u.type === upgrade.type && u.slotIndex === newUpgrade.slotIndex
      );

      if (existingUpgradeIndex !== -1) {
        updatedAssignedUpgrades[existingUpgradeIndex] = newUpgrade;
      } else {
        updatedAssignedUpgrades.push(newUpgrade);
      }

      // Add new unique class names using setTimeout to avoid React state updates during render
      if (upgrade.unique) {
        setTimeout(() => addUniqueClassName(upgrade.name), 0);
      }
      if (upgrade["unique-class"]) {
        upgrade["unique-class"].forEach((uc) => {
          setTimeout(() => addUniqueClassName(uc), 0);
        });
      }

      // Handle disabled upgrades
      const newDisabledUpgrades = [...(disabledUpgrades[ship.id] || [])];
      if (upgrade.restrictions?.disable_upgrades) {
        newDisabledUpgrades.push(...upgrade.restrictions.disable_upgrades);
      }
      if (upgrade.type === "title") {
        newDisabledUpgrades.push("title");
      }
      setDisabledUpgrades({
        ...disabledUpgrades,
        [ship.id]: newDisabledUpgrades,
      });

      // Handle enabled upgrades
      const newEnabledUpgrades = [...(enabledUpgrades[ship.id] || [])];
      const updatedAvailableUpgrades = [...ship.availableUpgrades];
      if (upgrade.restrictions?.enable_upgrades) {
        upgrade.restrictions.enable_upgrades
          .filter((enabledUpgrade) => enabledUpgrade.trim() !== "")
          .forEach((enabledUpgrade) => {
            // Only add to availableUpgrades if it's not already there
            if (!updatedAvailableUpgrades.includes(enabledUpgrade)) {
              updatedAvailableUpgrades.push(enabledUpgrade);
            }
          });
      }

      setEnabledUpgrades({
        ...enabledUpgrades,
        [ship.id]: newEnabledUpgrades,
      });

      // Update filledSlots
      setFilledSlots((prevFilledSlots) => {
        const shipSlots = prevFilledSlots[ship.id] || {};
        const upgradeTypeSlots = shipSlots[upgrade.type] || [];
        const updatedSlots = [
          ...upgradeTypeSlots,
          ship.assignedUpgrades.length,
        ];
        return {
          ...prevFilledSlots,
          [ship.id]: {
            ...shipSlots,
            [upgrade.type]: updatedSlots,
          },
        };
      });

      // Sort the upgrades based on the order of availableUpgrades
      const sortedUpgrades = [...updatedAssignedUpgrades].sort((a, b) => {
        const aIndex = ship.availableUpgrades.indexOf(a.type);
        const bIndex = ship.availableUpgrades.indexOf(b.type);
        return aIndex - bIndex;
      });

      return {
        ...ship,
        assignedUpgrades: sortedUpgrades,
        availableUpgrades: updatedAvailableUpgrades,
      };
    });
  }, [disabledUpgrades, enabledUpgrades, addUniqueClassName]);

  const handleSelectUpgrade = useCallback((
    upgrade: Upgrade, 
    currentShipId: string, 
    currentUpgradeType: string, 
    currentUpgradeIndex: number,
    ships: Ship[],
    updateShip: (id: string, updater: (ship: Ship) => Ship) => void
  ) => {
    let totalPointDifference = 0;

    updateShip(currentShipId, (ship) => {
      const newUpgrade = { ...upgrade, slotIndex: currentUpgradeIndex };
      const updatedAssignedUpgrades = [...ship.assignedUpgrades];
      const existingUpgradeIndex = updatedAssignedUpgrades.findIndex(
        (u) =>
          u.type === currentUpgradeType &&
          u.slotIndex === currentUpgradeIndex
      );

      let pointDifference = upgrade.points;

      // Remove old upgrade if it exists
      if (existingUpgradeIndex !== -1) {
        const oldUpgrade = updatedAssignedUpgrades[existingUpgradeIndex];

        // Remove enabled upgrades and slots
        if (oldUpgrade.restrictions?.enable_upgrades) {
          oldUpgrade.restrictions.enable_upgrades.forEach((enabledType) => {
            const enabledUpgradeIndices = updatedAssignedUpgrades
              .map((u, index) => (u.type === enabledType ? index : -1))
              .filter((index) => index !== -1);

            if (enabledUpgradeIndices.length > 0) {
              const lastEnabledUpgradeIndex = Math.max(
                ...enabledUpgradeIndices
              );
              const enabledUpgrade =
                updatedAssignedUpgrades[lastEnabledUpgradeIndex];
              pointDifference -= enabledUpgrade.points;
              handleRemoveUpgrade(
                ship.id,
                enabledUpgrade.type,
                enabledUpgrade.slotIndex || 0,
                ships,
                updateShip
              );
              updatedAssignedUpgrades.splice(lastEnabledUpgradeIndex, 1);

              // Remove the slot from availableUpgrades
              const slotIndex =
                ship.availableUpgrades.lastIndexOf(enabledType);
              if (slotIndex !== -1) {
                ship.availableUpgrades.splice(slotIndex, 1);
              }
            }
          });
        }
        if (oldUpgrade.unique) {
          removeUniqueClassName(oldUpgrade.name);
        }
        if (oldUpgrade["unique-class"]) {
          oldUpgrade["unique-class"].forEach((uc) =>
            removeUniqueClassName(uc)
          );
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
        upgrade["unique-class"].forEach((uc) => addUniqueClassName(uc));
      }

      // Handle disabled upgrades
      const newDisabledUpgrades = [...(disabledUpgrades[ship.id] || [])];
      if (upgrade.restrictions?.disable_upgrades) {
        newDisabledUpgrades.push(...upgrade.restrictions.disable_upgrades);
      }
      if (upgrade.type === "title") {
        newDisabledUpgrades.push("title");
      }
      setDisabledUpgrades({
        ...disabledUpgrades,
        [ship.id]: newDisabledUpgrades,
      });

      // Handle enabled upgrades
      const newEnabledUpgrades = [...(enabledUpgrades[ship.id] || [])];
      if (upgrade.restrictions?.enable_upgrades) {
        upgrade.restrictions.enable_upgrades
          .filter((enabledUpgrade) => enabledUpgrade.trim() !== "")
          .forEach((enabledUpgrade) => {
            if (!newEnabledUpgrades.includes(enabledUpgrade)) {
              // Create a new array instead of modifying the existing one
              ship.availableUpgrades = [...ship.availableUpgrades, enabledUpgrade];
            }
          });
      }
      setEnabledUpgrades({
        ...enabledUpgrades,
        [ship.id]: newEnabledUpgrades,
      });

      // Update filledSlots
      setFilledSlots((prevFilledSlots) => {
        const shipSlots = prevFilledSlots[ship.id] || {};
        const upgradeTypeSlots = shipSlots[currentUpgradeType] || [];
        const updatedSlots = upgradeTypeSlots.includes(currentUpgradeIndex)
          ? upgradeTypeSlots
          : [...upgradeTypeSlots, currentUpgradeIndex];
        return {
          ...prevFilledSlots,
          [ship.id]: {
            ...shipSlots,
            [currentUpgradeType]: updatedSlots,
          },
        };
      });

      if (upgrade.type === "weapons-team-offensive-retro") {
        const weaponsTeamIndex =
          ship.availableUpgrades.indexOf("weapons-team");
        const offensiveRetroIndex =
          ship.availableUpgrades.indexOf("offensive-retro");
        setFilledSlots((prevFilledSlots) => ({
          ...prevFilledSlots,
          [ship.id]: {
            ...prevFilledSlots[ship.id],
            "weapons-team": [
              ...(prevFilledSlots[ship.id]?.["weapons-team"] || []),
              weaponsTeamIndex,
            ],
            "offensive-retro": [
              ...(prevFilledSlots[ship.id]?.["offensive-retro"] || []),
              offensiveRetroIndex,
            ],
            "weapons-team-offensive-retro": [
              ...(prevFilledSlots[ship.id]?.[
                "weapons-team-offensive-retro"
              ] || []),
              currentUpgradeIndex,
            ],
          },
        }));
      }

      // Sort the upgrades based on the order of availableUpgrades
      const sortedUpgrades = [...updatedAssignedUpgrades].sort((a, b) => {
        const aIndex = ship.availableUpgrades.indexOf(a.type);
        const bIndex = ship.availableUpgrades.indexOf(b.type);
        return aIndex - bIndex;
      });

      // Handle grey upgrades
      const newGreyUpgrades = [...(greyUpgrades[currentShipId] || [])];
      if (upgrade.restrictions?.grey_upgrades) {
        newGreyUpgrades.push(...upgrade.restrictions.grey_upgrades);
      }
      setGreyUpgrades({
        ...greyUpgrades,
        [currentShipId]: newGreyUpgrades,
      });

      return {
        ...ship,
        points: ship.points,
        assignedUpgrades: sortedUpgrades,
        availableUpgrades: ship.availableUpgrades,
      };
    });

    return totalPointDifference;
  }, [disabledUpgrades, enabledUpgrades, greyUpgrades, addUniqueClassName, removeUniqueClassName]);

  const handleRemoveUpgrade = useCallback((
    shipId: string, 
    upgradeType: string, 
    upgradeIndex: number,
    ships: Ship[],
    updateShip: (id: string, updater: (ship: Ship) => Ship) => void
  ) => {
    const shipToUpdate = ships.find((ship) => ship.id === shipId);
    const upgradeToRemove = shipToUpdate?.assignedUpgrades.find(
      (u) => u.type === upgradeType && u.slotIndex === upgradeIndex
    );

    // Find and remove all flagship upgrades from the ship, but only if the current upgrade is not itself a flagship upgrade
    const currentUpgradeIsFlagship = upgradeToRemove?.restrictions?.flagship === true;
    if (!currentUpgradeIsFlagship) {
      const flagshipUpgrades = shipToUpdate?.assignedUpgrades.filter(
        upgrade => upgrade.restrictions?.flagship === true
      ) || [];
      
      flagshipUpgrades.forEach(flagshipUpgrade => {
        if (flagshipUpgrade.type !== upgradeType || flagshipUpgrade.slotIndex !== upgradeIndex) {
          handleRemoveUpgrade(shipId, flagshipUpgrade.type, flagshipUpgrade.slotIndex || 0, ships, updateShip);
        }
      });
    }

    let pointsToRemove = 0;

    updateShip(shipId, (ship) => {
      const upgradeToRemove = ship.assignedUpgrades.find(
        (u) => u.type === upgradeType && u.slotIndex === upgradeIndex
      );
      if (upgradeToRemove) {
        let upgradesToRemove = [upgradeToRemove];
        pointsToRemove = upgradeToRemove.points;

        // Check for enabled upgrades
        if (upgradeToRemove.restrictions?.enable_upgrades) {
          const enabledUpgradesToRemove = ship.assignedUpgrades.filter(
            (u) =>
              upgradeToRemove.restrictions?.enable_upgrades?.includes(
                u.type
              )
          );
          upgradesToRemove = [
            ...enabledUpgradesToRemove,
            upgradeToRemove,
          ];
          pointsToRemove += enabledUpgradesToRemove.reduce(
            (sum, u) => sum + u.points,
            0
          );

          // Remove the enabled upgrade slots from availableUpgrades
          upgradeToRemove.restrictions.enable_upgrades.forEach(
            (enabledType) => {
              const slotIndex =
                ship.availableUpgrades.lastIndexOf(enabledType);
              if (slotIndex !== -1) {
                ship.availableUpgrades.splice(slotIndex, 1);
              }
            }
          );
        }

        // Process all upgrades to remove
        upgradesToRemove.forEach((upgrade) => {
          // Remove unique class with setTimeout
          if (upgrade.unique) {
            setTimeout(() => removeUniqueClassName(upgrade.name), 0);
          }
          if (upgrade["unique-class"]) {
            upgrade["unique-class"].forEach((uc) => {
              setTimeout(() => removeUniqueClassName(uc), 0);
            });
          }

          // Update disabled upgrades
          setDisabledUpgrades((prev) => ({
            ...prev,
            [shipId]: (prev[shipId] || []).filter(
              (u) => !upgrade.restrictions?.disable_upgrades?.includes(u)
            ),
          }));

          // Update enabled upgrades
          setEnabledUpgrades((prev) => ({
            ...prev,
            [shipId]: (prev[shipId] || []).filter(
              (u) => !upgrade.restrictions?.enable_upgrades?.includes(u)
            ),
          }));

          // Update grey_upgrades
          setGreyUpgrades((prev) => ({
            ...prev,
            [shipId]: (prev[shipId] || []).filter(
              (u) => !upgrade.restrictions?.grey_upgrades?.includes(u)
            ),
          }));

          // If it's a title, remove the 'title' from disabled upgrades
          if (upgrade.type === "title") {
            setDisabledUpgrades((prev) => ({
              ...prev,
              [shipId]: (prev[shipId] || []).filter((u) => u !== "title"),
            }));
          }

          // Update filledSlots
          setFilledSlots((prevFilledSlots) => {
            const shipSlots = prevFilledSlots[shipId] || {};
            const upgradeTypeSlots = [...(shipSlots[upgrade.type] || [])];
            const updatedSlots = upgradeTypeSlots.filter(
              (slot) => slot !== upgrade.slotIndex
            );

            if (upgrade.type === "weapons-team-offensive-retro") {
              const weaponsTeamSlots = [
                ...(shipSlots["weapons-team"] || []),
              ];
              const offensiveRetroSlots = [
                ...(shipSlots["offensive-retro"] || []),
              ];
              return {
                ...prevFilledSlots,
                [shipId]: {
                  ...shipSlots,
                  "weapons-team": weaponsTeamSlots.filter(
                    (slot) => slot !== upgrade.slotIndex
                  ),
                  "offensive-retro": offensiveRetroSlots.filter(
                    (slot) => slot !== upgrade.slotIndex
                  ),
                  [upgrade.type]: updatedSlots,
                },
              };
            } else {
              return {
                ...prevFilledSlots,
                [shipId]: {
                  ...shipSlots,
                  [upgrade.type]: updatedSlots,
                },
              };
            }
          });
        });

        return {
          ...ship,
          points: ship.points, // Keep the ship's base points unchanged
          assignedUpgrades: ship.assignedUpgrades.filter(
            (u) => !upgradesToRemove.includes(u)
          ),
          availableUpgrades: ship.availableUpgrades,
        };
      }
      return ship;
    });

    return pointsToRemove;
  }, [removeUniqueClassName]);

  const clearUpgradeState = useCallback((shipId: string) => {
    setDisabledUpgrades((prev) => {
      const newDisabled = { ...prev };
      delete newDisabled[shipId];
      return newDisabled;
    });
    setEnabledUpgrades((prev) => {
      const newEnabled = { ...prev };
      delete newEnabled[shipId];
      return newEnabled;
    });
    setFilledSlots((prev) => {
      const newFilled = { ...prev };
      delete newFilled[shipId];
      return newFilled;
    });
    setGreyUpgrades((prev) => {
      const newGrey = { ...prev };
      delete newGrey[shipId];
      return newGrey;
    });
  }, []);

  return {
    disabledUpgrades,
    enabledUpgrades,
    filledSlots,
    greyUpgrades,
    setDisabledUpgrades,
    setEnabledUpgrades,
    setFilledSlots,
    setGreyUpgrades,
    handleAddUpgrade,
    handleSelectUpgrade,
    handleRemoveUpgrade,
    clearUpgradeState
  };
}; 