/* eslint-disable @typescript-eslint/no-empty-interface */
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Printer,
  FileText,
  Trash2,
  TriangleAlert,
  Import
} from "lucide-react";
import { ShipSelector } from "./ShipSelector";
import { SelectedShip } from "./SelectedShip";
import { ShipFilter } from "./ShipFilter";
import { ShipModel } from "./ShipSelector";
import { SelectedSquadron } from "./SelectedSquadron";
import { SquadronFilter } from "./SquadronFilter";
import { SquadronSelector } from "./SquadronSelector";
import { PointsDisplay } from "./PointsDisplay";
import { useTheme } from "next-themes";
import { ObjectiveSelector, ObjectiveModel } from "./ObjectiveSelector";
import UpgradeSelector from "./UpgradeSelector";
import { ExportTextPopup } from "./ExportTextPopup";
import { factionLogos } from "../pages/[faction]";
import { useUniqueClassContext } from "../contexts/UniqueClassContext";
import { SwipeableObjective } from "./SwipeableObjective";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { TextImportWindow } from "./TextImportWindow";
import { NotificationWindow } from "./NotificationWindow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FleetRecoveryPopup } from "./FleetRecoveryPopup";
import { SaveFleetButton } from './SaveFleetButton';
import { useRouter } from 'next/router';
import { PrintMenu } from "./PrintMenu";

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
  source: ContentSource;
  searchableText: string;
}

export interface Squadron {
  id: string;
  name: string;
  "ace-name"?: string;
  squadron_type: string;
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
    "anti-squadron": [number, number, number];
    "anti-ship": [number, number, number];
  };
  ace: boolean;
  "unique-class": string[];
  source: ContentSource;
  searchableText: string;
}

interface Objective {
  id: string;
  name: string;
  cardimage: string;
  type: 'assault' | 'defense' | 'navigation';
  source: ContentSource;
}

export interface Upgrade {
  id: string;
  alias?: string;
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
    disqualify_if?: {
      size?: string[];
      has_upgrade_type?: string[];
    };
    flagship: boolean;
  };
  exhaust?: {
    type: "blank" | "recur" | "nonrecur";
    ready_token?: string[];
    ready_amount?: number;
  };
  searchableText: string;
  source: ContentSource;
}

export interface Ship extends ShipModel {
  id: string;
  availableUpgrades: string[];
  assignedUpgrades: Upgrade[];
  searchableText: string;
}

export type ContentSource = "regular" | "legacy" | "legends" | "oldLegacy" | "arc";

const SectionHeader = ({
  title,
  points,
  previousPoints,
  onClearAll,
  onAdd,
}: {
  title: string;
  points: number;
  previousPoints: number;
  show: boolean;
  onClearAll: () => void;
  onAdd: () => void;
}) => (
  <Card className="mb-4 relative">
    <Button
      className="w-full justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30 text-lg py-6"
      variant="outline"
      onClick={onAdd}
    >
      <span className="flex items-center text-l">ADD {title.toUpperCase()}</span>
      <span className="flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="mr-2 text-red-500 hover:text-opacity-70"
        >
          <Trash2 size={16} />
        </button>
        <PointsDisplay points={points} previousPoints={previousPoints} />
      </span>
    </Button>
  </Card>
);

export default function FleetBuilder({
  faction,
  fleetName,
  setFleetName,
  tournamentMode,
}: {
  faction: string;
  factionColor: string;
  fleetName: string;
  setFleetName: React.Dispatch<React.SetStateAction<string>>;
  tournamentMode: boolean;
  setTournamentMode: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [points, setPoints] = useState(0);
  const [previousPoints, setPreviousPoints] = useState(0);
  const [showShipSelector, setShowShipSelector] = useState(false);
  const [showSquadronSelector, setShowSquadronSelector] = useState(false);
  const [selectedShips, setSelectedShips] = useState<Ship[]>([]);
  const [selectedSquadrons, setSelectedSquadrons] = useState<Squadron[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [shipFilter, setShipFilter] = useState({
    minPoints: 0,
    maxPoints: 1000,
  });
  const [squadronFilter, setSquadronFilter] = useState({
    minPoints: 0,
    maxPoints: 1000,
  });
  const [totalShipPoints, setTotalShipPoints] = useState(0);
  const [totalSquadronPoints, setTotalSquadronPoints] = useState(0);
  const [previousShipPoints, setPreviousShipPoints] = useState(0);
  const [previousSquadronPoints, setPreviousSquadronPoints] = useState(0);
  const {} = useTheme();
  const [showAssaultObjectiveSelector, setShowAssaultObjectiveSelector] =
    useState(false);
  const [showDefenseObjectiveSelector, setShowDefenseObjectiveSelector] =
    useState(false);
  const [showNavigationObjectiveSelector, setShowNavigationObjectiveSelector] =
    useState(false);
  const [selectedAssaultObjective, setSelectedAssaultObjective] =
    useState<ObjectiveModel | null>(null);
  const [selectedDefenseObjective, setSelectedDefenseObjective] =
    useState<ObjectiveModel | null>(null);
  const [selectedNavigationObjective, setSelectedNavigationObjective] =
    useState<ObjectiveModel | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uniqueClassNames, setUniqueClassNames] = useState<string[]>([]);
  const [showUpgradeSelector, setShowUpgradeSelector] = useState(false);
  const [currentUpgradeType, setCurrentUpgradeType] = useState("");
  const [currentShipId, setCurrentShipId] = useState("");
  const [showExportPopup, setShowExportPopup] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { addUniqueClassName, removeUniqueClassName } = useUniqueClassContext();
  const [currentUpgradeIndex, setCurrentUpgradeIndex] = useState<number>(0);
  const [disabledUpgrades, setDisabledUpgrades] = useState<
    Record<string, string[]>
  >({});
  const [enabledUpgrades, setEnabledUpgrades] = useState<
    Record<string, string[]>
  >({});
  const [filledSlots, setFilledSlots] = useState<
    Record<string, Record<string, number[]>>
  >({});
  const [hasCommander, setHasCommander] = useState(false);
  const [squadronToSwap, setSquadronToSwap] = useState<string | null>(null);
  const [tournamentViolations, setTournamentViolations] = useState<string[]>(
    []
  );
  const [showImportWindow, setShowImportWindow] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [squadronIdCounter, setSquadronIdCounter] = useState(0);
  const [showRecoveryPopup, setShowRecoveryPopup] = useState(false);
  const [hasLoadedPage, setHasLoadedPage] = useState(false);
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [paperSize, setPaperSize] = useState<'letter' | 'a4'>('letter');
  // Add these state variables near the other useState declarations
const [showPrintRestrictions, setShowPrintRestrictions] = useState(true);
const [showPrintObjectives, setShowPrintObjectives] = useState(true);


  const checkTournamentViolations = useMemo(() => {
    const violations: string[] = [];

    if (points > 400) {
      violations.push("Fleet exceeds 400 point limit");
    }

    if (totalSquadronPoints > 134) {
      violations.push("Squadrons exceed 134 point limit");
    }

    const flotillaCount = selectedShips.filter((ship) =>
      ship.traits?.includes("flotilla")
    ).length;
    if (flotillaCount > 2) {
      violations.push("More than two flotillas in fleet");
    }

    const aceSquadronCount = selectedSquadrons.filter(
      (squadron) => squadron.ace === true
    ).length;
    if (aceSquadronCount > 4) {
      violations.push("More than four aces in fleet");
    }

    if (
      !selectedAssaultObjective ||
      !selectedDefenseObjective ||
      !selectedNavigationObjective
    ) {
      violations.push("Missing objective card(s)");
    }

    const commanderCount = selectedShips
      .flatMap((ship) => ship.assignedUpgrades)
      .filter((upgrade) => upgrade.type === "commander").length;
    if (commanderCount !== 1) {
      violations.push("One commander upgrade is required");
    }

    return violations;
  }, [
    points,
    totalSquadronPoints,
    selectedShips,
    selectedSquadrons,
    selectedAssaultObjective,
    selectedDefenseObjective,
    selectedNavigationObjective,
  ]);

  useEffect(() => {
    if (tournamentMode) {
      setTournamentViolations(checkTournamentViolations);
    }
    
    // Cleanup function to reset state when component unmounts
    return () => {
      // Clear unique class names
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
      
      selectedSquadrons.forEach(squadron => {
        if (squadron.unique) {
          removeUniqueClassName(squadron.name);
        }
        if (squadron["unique-class"]) {
          squadron["unique-class"].forEach(uc => removeUniqueClassName(uc));
        }
      });
    };
  }, [tournamentMode, checkTournamentViolations, selectedShips, selectedSquadrons, removeUniqueClassName]);

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
      size: ship.size || "",
      traits: ship.traits || [],
      source: ship.source || "regular",
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
    const shipToRemove = selectedShips.find((ship) => ship.id === id);
    if (shipToRemove) {
      const shipPoints =
        shipToRemove.points +
        shipToRemove.assignedUpgrades.reduce(
          (total, upgrade) => total + upgrade.points,
          0
        );

      // Check if the ship had a commander upgrade
      const hadCommander = shipToRemove.assignedUpgrades.some(
        (upgrade) => upgrade.type === "commander"
      );

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

      setSelectedShips(selectedShips.filter((ship) => ship.id !== id));
      setPreviousPoints(points);
      setPreviousShipPoints(totalShipPoints);
      const newPoints = points - shipPoints;
      setPoints(newPoints);
      setTotalShipPoints(totalShipPoints - shipPoints);

      // Clear disabled and enabled upgrades for the removed ship
      setDisabledUpgrades((prev) => {
        const newDisabled = { ...prev };
        delete newDisabled[id];
        return newDisabled;
      });
      setEnabledUpgrades((prev) => {
        const newEnabled = { ...prev };
        delete newEnabled[id];
        return newEnabled;
      });

      // Set hasCommander to false if the removed ship had a commander
      if (hadCommander) {
        setHasCommander(false);
      }
    }
  };

  const handleUpgradeClick = (
    shipId: string,
    upgradeType: string,
    upgradeIndex: number
  ) => {
    const ship = selectedShips.find((s) => s.id === shipId);
    if (ship) {
      setCurrentShipId(shipId);
      setCurrentUpgradeType(upgradeType);
      setCurrentUpgradeIndex(upgradeIndex);
      setShowUpgradeSelector(true);
    }
  };

  const handleSelectUpgrade = (upgrade: Upgrade) => {
    let totalPointDifference = 0;

    setSelectedShips((prevShips) =>
      prevShips.map((ship) => {
        if (ship.id === currentShipId) {
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
                    enabledUpgrade.slotIndex || 0
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
                  ship.availableUpgrades.push(enabledUpgrade);
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

          return {
            ...ship,
            points: ship.points,
            assignedUpgrades: sortedUpgrades,
            availableUpgrades: ship.availableUpgrades,
          };
        }
        return ship;
      })
    );

    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPoints((prevPoints) => prevPoints + totalPointDifference);
    setTotalShipPoints((prevTotal) => prevTotal + totalPointDifference);

    if (upgrade.type === "commander") {
      setHasCommander(true);
    }

    setShowUpgradeSelector(false);
  };

  const handleAddUpgrade = (shipId: string, upgrade: Upgrade) => {
    setSelectedShips((prevShips) =>
      prevShips.map((ship) => {
        if (ship.id === shipId) {
          const exhaustType = upgrade.exhaust?.type || "";
          const isModification = upgrade.modification ? "modification" : "";

          // Determine the source based on the alias
          let source: ContentSource = "regular";
          if (upgrade.alias) {
            if (upgrade.alias.includes("OldLegacy")) {
              source = "oldLegacy";
            } else if (upgrade.alias.includes("Legacy")) {
              source = "legacy";
            } else if (upgrade.alias.includes("Legends")) {
              source = "legends";
            } else if (upgrade.alias.includes("ARC")) {
              source = "arc";
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
                  ship.availableUpgrades.push(enabledUpgrade);
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

          if (upgrade.type === "commander") {
            setHasCommander(true);
          }

          return {
            ...ship,
            assignedUpgrades: sortedUpgrades,
            availableUpgrades: ship.availableUpgrades,
          };
        }
        return ship;
      })
    );

    // Update points separately to avoid double-counting
    setPoints((prevPoints) => prevPoints + upgrade.points);
    setTotalShipPoints((prevTotal) => prevTotal + upgrade.points);
  };

  const handleRemoveUpgrade = useCallback(
    (shipId: string, upgradeType: string, upgradeIndex: number) => {
      const shipToUpdate = selectedShips.find((ship) => ship.id === shipId);
      const upgradeToRemove = shipToUpdate?.assignedUpgrades.find(
        (u) => u.type === upgradeType && u.slotIndex === upgradeIndex
      );

      if (upgradeToRemove && upgradeToRemove.type === "commander") {
        setHasCommander(false);
      }

      // Find and remove all flagship upgrades from the ship
      const flagshipUpgrades = shipToUpdate?.assignedUpgrades.filter(
        upgrade => upgrade.restrictions?.flagship === true
      ) || [];
      
      flagshipUpgrades.forEach(flagshipUpgrade => {
        handleRemoveUpgrade(shipId, flagshipUpgrade.type, flagshipUpgrade.slotIndex || 0);
      });

      console.log("Before removal:", selectedShips);
      setSelectedShips((prevShips) =>
        prevShips.map((ship) => {
          if (ship.id === shipId) {
            const upgradeToRemove = ship.assignedUpgrades.find(
              (u) => u.type === upgradeType && u.slotIndex === upgradeIndex
            );
            if (upgradeToRemove) {
              console.log("Removing upgrade:", upgradeToRemove);

              let upgradesToRemove = [upgradeToRemove];
              let pointsToRemove = upgradeToRemove.points;

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

              setPreviousPoints(points);
              setPreviousShipPoints(totalShipPoints);
              setPoints((prevPoints) => prevPoints - pointsToRemove);
              setTotalShipPoints((prevTotal) => prevTotal - pointsToRemove);

              return {
                ...ship,
                points: ship.points, // Keep the ship's base points unchanged
                assignedUpgrades: ship.assignedUpgrades.filter(
                  (u) => !upgradesToRemove.includes(u)
                ),
                availableUpgrades: ship.availableUpgrades,
              };
            }
          }
          return ship;
        })
      );
      console.log("After removal:", selectedShips);
    },
    [
      points,
      removeUniqueClassName,
      totalShipPoints,
      selectedShips,
      setSelectedShips,
      setPreviousPoints,
      setPoints,
      setTotalShipPoints,
      setHasCommander,
    ]
  );

  const handleCopyShip = (shipToCopy: Ship) => {
    if (shipToCopy.unique) {
      alert("Unique ships cannot be copied.");
      return;
    }
  
    // Load aliases from localStorage
    const aliases = JSON.parse(localStorage.getItem("aliases") || "{}");
    
    // Format the ship name with source tag if needed
    const shipNameWithSource = shipToCopy.source && shipToCopy.source !== "regular" 
      ? `${shipToCopy.name} [${shipToCopy.source === 'oldLegacy' ? 'OldLegacy' : 
          shipToCopy.source === 'legacy' ? 'Legacy' : 
          shipToCopy.source === 'legends' ? 'Legends' : 
          'ARC'}]`
      : shipToCopy.name;
    
    // Get the ship's alias key with the properly formatted name
    const shipKey = getAliasKey(aliases, `${shipNameWithSource} (${shipToCopy.points})`);
    
    if (!shipKey) {
      console.error("Could not find ship in aliases");
      return;
    }
  
    // Fetch a fresh copy of the ship
    const freshShipModel = fetchShip(shipKey);
    if (!freshShipModel) {
      console.error("Could not fetch ship model");
      return;
    }
  
    // Create new ship with fresh upgrade slots
    const newShip: Ship = {
      ...freshShipModel,
      id: Date.now().toString(),
      assignedUpgrades: [],
      availableUpgrades: freshShipModel.upgrades || [],
      size: freshShipModel.size || "unknown",
      searchableText: freshShipModel.searchableText || "",
      source: shipToCopy.source
    };
  
    let pointsToAdd = newShip.points;
  
    // Copy over non-unique upgrades that don't add slots
    shipToCopy.assignedUpgrades.forEach((upgrade) => {
      // Skip unique upgrades
      if (upgrade.unique) return;

      // Skip flagship upgrades
    if (upgrade.restrictions?.flagship) return;

  
      // Skip upgrades that were in slots added by other upgrades
      const upgradeTypeExists = freshShipModel.upgrades?.includes(upgrade.type);
      if (!upgradeTypeExists) return;
  
      // Fetch a fresh copy of the upgrade
      const upgradeKey = getAliasKey(aliases, `${upgrade.name} (${upgrade.points})`);
      if (!upgradeKey) return;
  
      const freshUpgrade = fetchUpgrade(upgradeKey);
      if (!freshUpgrade) return;
  
      // Add the upgrade to the new ship
      newShip.assignedUpgrades.push({
        ...freshUpgrade,
        slotIndex: upgrade.slotIndex,
        source: upgrade.source
      });
      pointsToAdd += freshUpgrade.points;
    });
  
    setSelectedShips((prevShips) => [...prevShips, newShip]);
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPoints((prevPoints) => prevPoints + pointsToAdd);
    setTotalShipPoints((prevTotal) => prevTotal + pointsToAdd);
  };

  const handleAddSquadron = () => {
    setShowSquadronSelector(true);
  };

  const handleSelectSquadron = (squadron: Squadron) => {
    if (squadronToSwap) {
      setSelectedSquadrons((prevSquadrons) =>
        prevSquadrons.map((s) => {
          if (s.id === squadronToSwap) {
            // Remove unique class names from the old squadron
            if (s.unique) {
              removeUniqueClassName(s.name);
            }
            if (s["unique-class"]) {
              s["unique-class"].forEach((uc) => removeUniqueClassName(uc));
            }

            const pointDifference = squadron.points - s.points;
            setPreviousPoints(points);
            setPreviousSquadronPoints(totalSquadronPoints);
            setPoints((prevPoints) => prevPoints + pointDifference);
            setTotalSquadronPoints((prevTotal) => prevTotal + pointDifference);

            // Add unique class names for the new squadron
            if (squadron.unique) {
              addUniqueClassName(squadron.name);
            }
            if (squadron["unique-class"]) {
              squadron["unique-class"].forEach((uc) => addUniqueClassName(uc));
            }

            return { ...squadron, id: generateUniqueSquadronId(), count: 1 };
          }
          return s;
        })
      );
      setSquadronToSwap(null);
    } else {
      handleAddingSquadron(squadron);
    }
    setShowSquadronSelector(false);
  };

  const handleAddingSquadron = (squadron: Squadron) => {
    const squadronId = generateUniqueSquadronId();
    const newSquadron: Squadron = {
      ...squadron,
      id: squadronId,
      count: 1,
      source: squadron.source,
    };
    setSelectedSquadrons((prevSquadrons) => [...prevSquadrons, newSquadron]);
    setPreviousPoints(points);
    setPreviousSquadronPoints(totalSquadronPoints);
    const newPoints = points + squadron.points;
    setPoints(newPoints);
    setTotalSquadronPoints(totalSquadronPoints + squadron.points);
  
    // Add unique class names for the new squadron
    if (squadron.unique) {
      addUniqueClassName(squadron.name);
    }
    if (squadron["unique-class"]) {
      squadron["unique-class"].forEach((uc) => addUniqueClassName(uc));
    }
    
    return squadronId;
  };

  const handleRemoveSquadron = (id: string) => {
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

      setSelectedSquadrons(
        selectedSquadrons.filter((squadron) => squadron.id !== id)
      );
      setPreviousPoints(points);
      setPreviousSquadronPoints(totalSquadronPoints);
      const newPoints =
        points - squadronToRemove.points * squadronToRemove.count;
      setPoints(newPoints);
      setTotalSquadronPoints(
        totalSquadronPoints - squadronToRemove.points * squadronToRemove.count
      );
    }
  };

  const handleIncrementSquadron = (id: string) => {
    setSelectedSquadrons((squadrons) =>
      squadrons.map((squadron) =>
        squadron.id === id
          ? { ...squadron, count: (squadron.count || 1) + 1 }
          : squadron
      )
    );
    const squadron = selectedSquadrons.find((s) => s.id === id);
    if (squadron) {
      setPreviousPoints(points);
      setPreviousSquadronPoints(totalSquadronPoints);
      const newPoints = points + squadron.points;
      setPoints(newPoints);
      setTotalSquadronPoints(totalSquadronPoints + squadron.points);
    }
  };

  const handleDecrementSquadron = (id: string) => {
    setSelectedSquadrons((prevSquadrons) => {
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
            if (squadron["unique-class"]) {
              squadron["unique-class"].forEach((uc) =>
                removeUniqueClassName(uc)
              );
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
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    const newPoints = points - totalShipPoints;
    setPoints(newPoints);
    setTotalShipPoints(0);
    setHasCommander(false); // Add this line
    localStorage.removeItem(`savedFleet_${faction}`);
  };

  const clearAllSquadrons = () => {
    selectedSquadrons.forEach((squadron) => {
      if (squadron.unique) {
        removeUniqueClassName(squadron.name);
      }
      if (squadron["unique-class"]) {
        squadron["unique-class"].forEach((uc) => removeUniqueClassName(uc));
      }
    });

    setPreviousPoints(points);
    setPreviousSquadronPoints(totalSquadronPoints);
    setPoints(points - totalSquadronPoints);
    setTotalSquadronPoints(0);
    setSelectedSquadrons([]);
    localStorage.removeItem(`savedFleet_${faction}`);
  };

  // Add this helper function to format the objective source
  const formatSource = (source: ContentSource) => {
    switch (source) {
      case 'legacy':
        return '[Legacy]';
      case 'legends':
        return '[Legends]';
      case 'oldLegacy':
        return '[OldLegacy]';
      case 'arc':
        return '[ARC]';
      default:
        return '';
    }
  };

  const generateExportText = useCallback(() => {

    const allRegularSource = [
      ...selectedShips,
      ...selectedShips.flatMap(ship => ship.assignedUpgrades),
      ...selectedSquadrons
    ].every(item => !item.source || item.source === 'regular');

    let text = " Name: " + fleetName + "\n";
    text += "Faction: " + faction.charAt(0).toUpperCase() + faction.slice(1) + "\n";

    const commander = selectedShips
      .flatMap((ship) => ship.assignedUpgrades)
      .find((upgrade) => upgrade.type === "commander");
    if (commander) {
      text += "Commander: " + commander.name + 
        (commander.source && commander.source !== "regular" ? " " + formatSource(commander.source) : "") + 
        " (" + commander.points + ")\n";
    }
    
    text += '\n';
    
    // Add objectives with source tags
    if (selectedAssaultObjective) {
      const sourceTag = formatSource(selectedAssaultObjective.source);
      text += `Assault: ${selectedAssaultObjective.name}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }
    if (selectedDefenseObjective) {
      const sourceTag = formatSource(selectedDefenseObjective.source);
      text += `Defense: ${selectedDefenseObjective.name}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }
    if (selectedNavigationObjective) {
      const sourceTag = formatSource(selectedNavigationObjective.source);
      text += `Navigation: ${selectedNavigationObjective.name}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }

    if (selectedShips.length > 0) {
      text += "\n";
      selectedShips.forEach((ship) => {
        // In the ships forEach loop, change this part:
        text += ship.name + 
          (ship.source && ship.source !== "regular" ? " " + formatSource(ship.source) : "") + 
          " (" + ship.points + ")\n";
        ship.assignedUpgrades.forEach((upgrade) => {
          const sourceSuffix = upgrade.source && upgrade.source !== "regular" 
            ? " " + formatSource(upgrade.source) 
            : "";
          text += "• " + upgrade.name + sourceSuffix + " (" + upgrade.points + ")\n";
        });
        text += "= " + 
          (ship.points + 
          ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0)) + 
          " Points\n\n";
      });
    }

    text += "Squadrons:\n";
    if (selectedSquadrons.length > 0) {
      const groupedSquadrons = selectedSquadrons.reduce((acc, squadron) => {
        const key =
          squadron.unique || squadron["ace-name"]
            ? (squadron["ace-name"] || squadron.name) + 
              (squadron["ace-name"] && !allRegularSource ? " - " + squadron.name : "") + 
              (squadron.source && squadron.source !== "regular" ? " " + formatSource(squadron.source) : "") + 
              " (" + squadron.points + ")"
            : squadron.name + 
              (squadron.source && squadron.source !== "regular" ? " " + formatSource(squadron.source) : "") + 
              " (" + (squadron.points * (squadron.count || 1)) + ")";
        if (!acc[key]) {
          acc[key] = {
            count: 0,
            isUnique: squadron.unique || !!squadron["ace-name"],
            points: squadron.points,
          };
        }
        acc[key].count += squadron.count || 1;
        return acc;
      }, {} as Record<string, { count: number; isUnique: boolean; points: number }>);

      Object.entries(groupedSquadrons).forEach(
        ([squadronKey, { count, isUnique }]) => {
          if (isUnique) {
            text += "• " + squadronKey + "\n";
          } else {
            text += "• " + count + " x " + squadronKey + "\n";
          }
        }
      );
    }
    text += "= " + totalSquadronPoints + " Points\n\n";

    text += "Total Points: " + points;

    // Ensure the text is not URL encoded
    return decodeURIComponent(encodeURIComponent(text));
  }, [
    selectedShips, 
    selectedSquadrons, 
    selectedAssaultObjective, 
    selectedDefenseObjective, 
    selectedNavigationObjective,
    faction,
    fleetName,
    points,
    totalSquadronPoints
  ]);

  const saveFleetToLocalStorage = useCallback(() => {
    const exportText = generateExportText();
    localStorage.setItem(`savedFleet_${faction}`, exportText);
  }, [faction, generateExportText]);
  
  const handleRecoverFleet = () => {
    const savedFleet = localStorage.getItem(`savedFleet_${faction}`);
    if (savedFleet) {
      handleImportFleet(savedFleet, 'kingston');
    }
    setShowRecoveryPopup(false);
  };
  
  const handleDeclineRecovery = () => {
    localStorage.removeItem(`savedFleet_${faction}`);
    setShowRecoveryPopup(false);
  };

  const getAliasKey = (
    aliases: Record<string, string>,
    name: string
  ): string | undefined => {
    console.log(`Getting alias key for: ${name}`);
    console.log(`Aliases:`, aliases);
    const result = aliases[name];
    console.log(`Alias key result:`, result);
    return result;
  };

  const fetchObjective = (key: string): ObjectiveModel | null => {
    console.log(`Fetching objective for key: ${key}`);
    
    // Get all localStorage keys that contain 'objectives'
    const objectiveKeys = Object.keys(localStorage).filter(k => 
      k.toLowerCase().includes('objectives')
    );
    
    // Search through all objective-related localStorage items
    for (const storageKey of objectiveKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
        console.log(`Checking objectives in ${storageKey}`);
        
        // Handle both direct objectives and nested objectives structure
        const objectivesData = data.objectives || data;
        
        // Check if the objective exists in this data
        if (objectivesData[key]) {
          console.log(`Found objective in ${storageKey}:`, objectivesData[key]);
          return {
            ...objectivesData[key],
            // Set source based on storage key
            source: storageKey.includes('arc') ? 'arc' :
                   storageKey.includes('oldLegacy') ? 'oldLegacy' :
                   storageKey.includes('legacy') ? 'legacy' :
                   storageKey.includes('legends') ? 'legends' : 'regular'
          } as ObjectiveModel;
        }
      } catch (error) {
        console.error(`Error parsing JSON for key ${storageKey}:`, error);
      }
    }
    
    console.log(`Objective not found for key: ${key}`);
    return null;
  };
  
  const fetchFromLocalStorage = (
    key: string,
    type: "ships" | "upgrades" | "squadrons"
    /* eslint-disable @typescript-eslint/no-explicit-any */
  ): any | null => {
    console.log(`Fetching ${type} for key: ${key}`);
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.toLowerCase().includes(type)) {
        try {
          const data = JSON.parse(localStorage.getItem(storageKey) || "{}");
          console.log(`Parsed ${type} data for ${storageKey}:`, data);
          const itemsData = data[type] || data;

          if (type === "ships") {
            for (const chassisKey in itemsData) {
              const chassis = itemsData[chassisKey];
              const models = chassis.models;
              if (models && models[key]) {
                const item = models[key];
                return {
                  ...item,
                  // Include chassis data
                  size: chassis.size || "small",
                  hull: chassis.hull,
                  speed: chassis.speed,
                  shields: chassis.shields,
                  hull_zones: chassis.hull_zones,
                  silhouette: chassis.silhouette,
                  blueprint: chassis.blueprint,
                  // Add source information
                  source: storageKey.includes('arc') ? 'arc' :
                          storageKey.includes('oldLegacy') ? 'oldLegacy' :
                          storageKey.includes('legacy') ? 'legacy' :
                          storageKey.includes('legends') ? 'legends' : 'regular'
                };
              }
            }
          } else {
            if (itemsData[key]) {
              const item = itemsData[key];
              return {
                ...item,
                source: storageKey.includes('arc') ? 'arc' :
                        storageKey.includes('oldLegacy') ? 'oldLegacy' :
                        storageKey.includes('legacy') ? 'legacy' :
                        storageKey.includes('legends') ? 'legends' : 'regular'
              };
            }
          }
        } catch (error) {
          console.error(`Error parsing JSON for key ${storageKey}:`, error);
        }
      }
    }
    return null;
  };

  const fetchShip = (key: string): ShipModel | null => {
    return fetchFromLocalStorage(key, "ships") as ShipModel | null;
  };

  const fetchUpgrade = (key: string): Upgrade | null => {
    return fetchFromLocalStorage(key, "upgrades") as Upgrade | null;
  };

  const fetchSquadron = (key: string): Squadron | null => {
    return fetchFromLocalStorage(key, "squadrons") as Squadron | null;
  };

  type FleetFormat = 'kingston' | 'afd' | 'warlords';


  const preprocessFleetText = (text: string, format: FleetFormat): string => {
    if (format === 'kingston') {
      return text;
    }

    // Remove HTML tags and normalize line endings
    text = text.replace(/<[^>]*>/g, '').replace(/\r\n/g, '\n');
    let lines = text.split('\n').map(line => line.trim()).filter(line => line);

    if (format === 'afd') {
      // Handle AFD format
      const firstLine = lines[0];
      const nameMatch = firstLine.match(/^(.+?)\s*\(\d+\/\d+\/\d+\)/);
      if (nameMatch) {
        lines[0] = `Name: ${nameMatch[1]}`;
        // Remove the line of equals signs if it exists
        if (lines[1] && lines[1].match(/^=+$/)) {
          lines.splice(1, 1);
        }
      }

      lines = lines.map(line => {
        // Convert bullet points
        line = line.replace(/^·\s*/, '• ');
        
        // Convert ship points format: (X + Y: Z) -> (X)
        line = line.replace(/\((\d+)\s*\+[^)]+\)/, '($1)');
        
        // Convert squadron format: (N x M) -> (calculated total)
        line = line.replace(/\((\d+)\s*x\s*(\d+)\)/, (_, count, points) => {
          const total = parseInt(count) * parseInt(points);
          return `(${total})`;
        });
        
        // Convert squadron format: N x Squadron (M) -> • N x Squadron (calculated total)
        line = line.replace(/^(\d+)\s*x\s*([^(]+)\((\d+)\)/, (_, count, name, points) => {
          const total = parseInt(count) * parseInt(points);
          return `• ${count} x ${name.trim()}(${total})`;
        });

        return line;
      });
    } else if (format === 'warlords') {
      const processedLines: string[] = [];
      let isProcessingSquadrons = false;
      let foundTotalShipCost = false;

      lines.forEach(line => {
        // Check for faction and points lines first
        if (line.match(/^Faction:/i)) {
          processedLines.push(`Faction: ${line.split(':')[1].trim()}`);
          return;
        }

        // Check if we've hit a "total ship cost" line
        if (line.includes('total ship cost')) {
          foundTotalShipCost = true;
          processedLines.push(line);
          return;
        }

        // Start squadron processing after the last "total ship cost"
        if (foundTotalShipCost && !isProcessingSquadrons && line.match(/^\d+\s+\w/)) {
          isProcessingSquadrons = true;
          processedLines.push('');  // Add blank line before squadrons
          processedLines.push('Squadrons:');
        }

        if (isProcessingSquadrons) {
          // Convert squadron format: "N Squadron Name ( X points)" -> "• N x Squadron Name (X)"
          if (line.match(/^\d+\s+\w/)) {
            const match = line.match(/^(\d+)\s+(.+?)\s*\(\s*(\d+)\s*points?\)/);
            if (match) {
              const [, count, name, points] = match;
              const numCount = parseInt(count);
              if (numCount === 1) {
                processedLines.push(`• ${name.trim()} (${points})`);
              } else {
                // Don't multiply the points - they're already total
                processedLines.push(`• ${numCount} x ${name.trim()} (${points})`);
              }
            }
          } else if (!line.includes('total squadron cost')) {
            processedLines.push(line);
          }
        } else {
          // Convert other lines (ships and upgrades)
          line = line
            .replace(/^-\s+/, '• ')
            .replace(/\[\s*flagship\s*\]\s*/, '')
            .replace(/\(\s*(\d+)\s*points?\)/, '($1)')
            .replace(/^(Assault|Defense|Navigation) Objective:/, '$1:');
          
          // Convert objective lines
          if (line.match(/^(Assault|Defense|Navigation):/)) {
            processedLines.push('');  // Add blank line before objectives
          }
          
          processedLines.push(line);
        }
      });

      return processedLines.join('\n');
    }

    return lines.join('\n');
  };

  const handleImportFleet = useCallback((importText: string, format: FleetFormat) => {
    console.log("Starting fleet import with format:", format);
    
    // Load aliases first
    const aliases = JSON.parse(localStorage.getItem("aliases") || "{}");
    const processedText = preprocessFleetText(importText, format);
    console.log("Preprocessed fleet text:", processedText);

    const lines = processedText.split("\n");


    // const lines = importText.split("\n");

    // Check faction first
    const factionLine = lines.find((line) => line.startsWith("Faction:"));
    let normalizedImportedFaction = '';

    if (factionLine) {
      const importedFaction = factionLine.split(":")[1].trim().toLowerCase();
      // Normalize faction names
      normalizedImportedFaction =
        importedFaction === "imperial" || importedFaction === "empire" || importedFaction === "galactic empire"
          ? "empire"
          : importedFaction === "rebel alliance"
          ? "rebel"
          : importedFaction === "galactic republic"
          ? "republic"
          : importedFaction === "separatist alliance"
          ? "separatist"
          : importedFaction;
    } else {
      // Try to determine faction from first ship, commander, or squadron
      const firstItemMatch = lines.find(line => {
        // Skip empty lines and section headers
        if (!line.trim() || line.startsWith('Total Points:') || line.startsWith('Squadrons:')) {
          return false;
        }
        
        // Extract item name and points
        const match = line.match(/^(?:•\s*)?(.+?)\s*\((\d+)\)/);
        if (match) {
          const [, itemName, itemPoints] = match;
          const itemKey = getAliasKey(aliases, `${itemName} (${itemPoints})`);
          
          if (itemKey) {
            // Try to fetch as ship first
            const ship = fetchShip(itemKey);
            if (ship?.faction) {
              normalizedImportedFaction = ship.faction.toLowerCase();
              return true;
            }
            
            // Try as squadron
            const squadron = fetchSquadron(itemKey);
            if (squadron?.faction && typeof squadron.faction === 'string') {
              normalizedImportedFaction = squadron.faction.toLowerCase();
              return true;
            }
          }
        }
        return false;
      });

      if (!firstItemMatch) {
        setNotificationMessage("Could not determine faction from fleet list. Import cancelled.");
        setShowNotification(true);
        return;
      }
    }

    const normalizedCurrentFaction = faction.toLowerCase();

    if (normalizedImportedFaction !== normalizedCurrentFaction) {
      // Instead of showing error, save fleet and redirect
      localStorage.setItem(`savedFleet_${normalizedImportedFaction}`, importText);
      document.cookie = "retrieved-from-list=true; path=/";
      
      // Navigate home first, then to the correct faction
      router.push('/').then(() => {
        setTimeout(() => {
          router.push(`/${normalizedImportedFaction}`);
        }, 250);
      });
      return;
    }

    const skippedItems: string[] = [];

    // Reset the fleet
    console.log("Resetting fleet...");
    clearAllShips();
    clearAllSquadrons();
    setSelectedAssaultObjective(null);
    setSelectedDefenseObjective(null);
    setSelectedNavigationObjective(null);

    let processingSquadrons = false;
    let totalPoints = 0;
    let squadronPoints = 0;
    const shipsToAdd: Ship[] = [];
    const upgradesToAdd: { shipId: string; upgrade: Upgrade }[] = [];
    let currentShipId: string | null = null;

    let shipIdCounter = 0;

    const generateUniqueShipId = (): string => {
      shipIdCounter++;
      const randomPart = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      return `ship_${shipIdCounter}_${randomPart}`;
    };

    const addShipToFleet = (
      shipName: string,
      shipPoints: string
    ): Ship | null => {
      const shipKey = getAliasKey(aliases, `${shipName} (${shipPoints})`);
      if (shipKey) {
        const shipModel = fetchShip(shipKey);
        if (shipModel) {
          console.log(`Adding ship to fleet:`, shipModel);
          let source: ContentSource = "regular";
          if (shipName.includes("[OldLegacy]")) {
            source = "oldLegacy";
          } else if (shipName.includes("[Legacy]")) {
            source = "legacy";
          } else if (shipName.includes("[Legends]")) {
            source = "legends";
          } else if (shipName.includes("[ARC]")) {
            source = "arc";
          }

          const newShip: Ship = {
            ...shipModel,
            id: generateUniqueShipId(),
            assignedUpgrades: [],
            availableUpgrades: shipModel.upgrades || [],
            size: shipModel.size || "small",
            searchableText: shipModel.searchableText || "",
            source: source,
          };
          return newShip;
        } else {
          // If ship not found, try to find a squadron
          const squadron = fetchSquadron(shipKey);
          if (squadron) {
            console.log(`Found squadron instead of ship:`, squadron);
            let source: ContentSource = "regular";
            if (shipName.includes("[OldLegacy]")) {
              source = "oldLegacy";
            } else if (shipName.includes("[Legacy]")) {
              source = "legacy";
            } else if (shipName.includes("[Legends]")) {
              source = "legends";
            } else if (shipName.includes("[ARC]")) {
              source = "arc";
            }
            const selectedSquadron = {
              ...squadron,
              source,
              points: parseInt(shipPoints) // Add this line to ensure points are set correctly
            };
            handleAddingSquadron(selectedSquadron);
            // Add to squadron points total
            squadronPoints += parseInt(shipPoints); // Add this line to update total squadron points
            return null;
          } else {
            console.log(`Neither ship nor squadron found: ${shipName}`);
            skippedItems.push(shipName);
          }
        }
      } else {
        console.log(`Ship/Squadron key not found in aliases: ${shipName}`);
        skippedItems.push(shipName);
      }
      return null;
    };

    for (const line of lines) {
      console.log("Processing line:", line);
      if (line.trim() === "") continue;

      if (line.startsWith("Faction:") || line.startsWith("Commander:")) {
        console.log("Skipping line:", line);
        continue;
      } else if (line.startsWith("Name:")) {
        const fleetNameMatch = line.match(/Name:\s*(.+)/);
        if (fleetNameMatch) {
          const newFleetName = fleetNameMatch[1].trim();
          setFleetName(newFleetName);
        }
        continue;
      } else if (line.startsWith("Total Points:")) {
        const pointsMatch = line.match(/Total Points:\s*(\d+)/);
        if (pointsMatch) {
          totalPoints = parseInt(pointsMatch[1]);
          console.log(`Setting total points to: ${totalPoints}`);
        }
        continue;
      } else if (line.startsWith("Squadrons:")) {
        processingSquadrons = true;
        continue;
      } else if (line.startsWith("= ") && processingSquadrons) {
        const squadronPointsMatch = line.match(/=\s*(\d+)\s*Points/);
        if (squadronPointsMatch) {
          squadronPoints = parseInt(squadronPointsMatch[1]);
          console.log(`Setting squadron points to: ${squadronPoints}`);
        }
        continue;
      } else if (
        (line.startsWith("Assault:") || line.startsWith("Defense:") || line.startsWith("Navigation:") || line.startsWith("Assault Objective:") || line.startsWith("Defense Objective:") || line.startsWith("Navigation Objective:")) 
      ) {
        // Handle objectives
        const [type, name] = line.split(":");
        const trimmedName = name?.trim();
        
        // If there's no name after the colon, skip this line
        if (!trimmedName) {
          console.log(`Skipping empty objective: ${type}`);
          continue;
        }
      
        const objectiveKey = getAliasKey(aliases, trimmedName);
        console.log(`Found objective: ${type} - ${trimmedName}`);
        if (objectiveKey) {
          const objective = fetchObjective(objectiveKey);
          console.log(`Fetched objective for key: ${objectiveKey}`, objective);
          if (objective) {
            console.log(`Setting selected objective: ${type}`);
            switch (type.toLowerCase()) {
              case "assault":
                setSelectedAssaultObjective(objective);
                break;
              case "defense":
                setSelectedDefenseObjective(objective);
                break;
              case "navigation":
                setSelectedNavigationObjective(objective);
                break;
            }
          } else {
            console.log(`Objective not found: ${trimmedName}`);
            skippedItems.push(trimmedName);
          }
        } else {
          console.log(`Objective key not found in aliases: ${trimmedName}`);
          skippedItems.push(trimmedName);
        }
      } else if (line.startsWith(" Name:") || line.startsWith("Name:")) {
        // Handle fleet name with or without leading space
        const fleetNameMatch = line.match(/Name:\s*(.+)/);
        if (fleetNameMatch) {
          const newFleetName = fleetNameMatch[1].trim();
          setFleetName(newFleetName);
        }
        continue;
      } else if (!processingSquadrons && !line.startsWith("•")) {
        // Handle ships
        const shipMatch = line.match(/^(.+?)\s*\((\d+)\)/);
        if (shipMatch) {
          const [, shipName, shipPoints] = shipMatch;
          let modifiedShipName = shipName;
          
          // Handle the Venator II case for Empire faction
          if (shipName.trim() === "Venator II" && shipPoints === "100" && faction.toLowerCase() === "empire") {
            modifiedShipName = "Venator II-Class Star Destroyer";
          }
          
          const newShip = addShipToFleet(modifiedShipName, shipPoints);
          if (newShip) {
            shipsToAdd.push(newShip);
            currentShipId = newShip.id;
          }
        }
      } else if (!processingSquadrons && line.startsWith("•") && currentShipId) {
        // Handle upgrades
        const upgradeMatch = line.match(/^•\s*(.+?)\s*\((\d+)\)/);
        if (upgradeMatch) {
          const [, upgradeName, upgradePoints] = upgradeMatch;
          const upgradeKey = getAliasKey(
            aliases,
            `${upgradeName} (${upgradePoints})`
          );
          if (upgradeKey) {
            const upgrade = fetchUpgrade(upgradeKey);
            if (upgrade) {
              // Extract source directly from the upgrade name string
              let source: ContentSource = "regular";
              const sourceMatch = upgradeName.match(/\[(.*?)\]/);
              if (sourceMatch) {
                const sourceTag = sourceMatch[1].toLowerCase();
                switch (sourceTag) {
                  case 'oldlegacy':
                    source = 'oldLegacy';
                    break;
                  case 'legacy':
                    source = 'legacy';
                    break;
                  case 'legends':
                    source = 'legends';
                    break;
                  case 'arc':
                    source = 'arc';
                    break;
                }
              }
              console.log(`Source for ${upgradeName}:`, source);

              // Find the next available slot for this upgrade type
              const existingUpgradesOfType = upgradesToAdd.filter(
                u => u.shipId === currentShipId && u.upgrade.type === upgrade.type
              );
              const usedSlots = existingUpgradesOfType.map(u => u.upgrade.slotIndex || 0);
              let nextSlot = 0;
              while (usedSlots.includes(nextSlot)) {
                nextSlot++;
              }
      
              upgradesToAdd.push({
                shipId: currentShipId,
                upgrade: { ...upgrade, source, slotIndex: nextSlot },
              });
            } else {
              console.log(`Upgrade not found: ${upgradeName}`);
              skippedItems.push(upgradeName);
            }
          } else {
            console.log(`Upgrade key not found in aliases: ${upgradeName}`);
            skippedItems.push(upgradeName);
          }
        }
      } else if (processingSquadrons && !line.startsWith("=")) {
        // Handle squadrons
        const squadronMatch = line.match(
          /^•?\s*(?:(\d+)\s*x\s*)?(.+?)\s*\((\d+)\)/
        );
        if (squadronMatch) {
          const [, countStr, squadronName, totalPoints] = squadronMatch;
          const count = countStr ? parseInt(countStr) : 1;
          const pointsPerSquadron = Math.round(parseInt(totalPoints) / count);
          
          // Add to squadron points total
          squadronPoints += parseInt(totalPoints);
          
          const squadronKey = getAliasKey(
            aliases,
            `${squadronName} (${pointsPerSquadron})`
          );
          console.log(
            `Found squadron: ${squadronName} (${pointsPerSquadron}) (count: ${count})`
          );
          if (squadronKey) {
            const squadron = fetchSquadron(squadronKey);
            console.log(`Fetched squadron for key: ${squadronKey}`, squadron);
            if (squadron) {
              console.log(`Selecting squadron:`, squadron);
              let source: ContentSource = "regular";
              if (squadronName.includes("[OldLegacy]")) {
                source = "oldLegacy";
              } else if (squadronName.includes("[Legacy]")) {
                source = "legacy";
              } else if (squadronName.includes("[Legends]")) {
                source = "legends";
              } else if (squadronName.includes("[ARC]")) {
                source = "arc";
              }
              const selectedSquadron = {
                ...squadron,
                source,
              };
              const squadronId = handleAddingSquadron(selectedSquadron);

              // Increment the count for the remaining squadrons
              if (squadronId) {
                for (let i = 1; i < count; i++) {
                  console.log(`Incrementing squadron count for ID: ${squadronId}`);
                  handleIncrementSquadron(squadronId);
                }
              }
            }
          } else {
            console.log(
              `Squadron key not found in aliases: ${squadronName} (${pointsPerSquadron})`
            );
            skippedItems.push(`${squadronName} (${pointsPerSquadron})`);
          }
        }
      }
    }

    // Add all ships to the fleet
    setSelectedShips(shipsToAdd);

    // Add upgrades to ships
    upgradesToAdd.forEach(({ shipId, upgrade }) => {
      handleAddUpgrade(shipId, upgrade);
    });

    // Calculate total ship points (ships + upgrades)
    const totalShipPoints = shipsToAdd.reduce((total, ship) => {
      const shipTotal = ship.points + 
        upgradesToAdd
          .filter(u => u.shipId === ship.id)
          .reduce((upgradeTotal, { upgrade }) => upgradeTotal + upgrade.points, 0);
      return total + shipTotal;
    }, 0);

    // Set all point values
    setTotalShipPoints(totalShipPoints);
    setTotalSquadronPoints(squadronPoints);
    setPoints(totalShipPoints + squadronPoints);

    if (skippedItems.length > 0) {
      alert(
        `The following items were skipped because they couldn't be found: ${skippedItems.join(
          ", "
        )}`
      );
      console.log("Skipped items:", skippedItems);
    }
  }, [
    fetchShip,
    fetchUpgrade,
    fetchSquadron,
    clearAllShips,
    clearAllSquadrons,
    faction,
    handleAddUpgrade,
    handleAddingSquadron,
    handleIncrementSquadron,
    router,
    setFleetName,
    setNotificationMessage,
    setPoints,
    setSelectedAssaultObjective,
    setSelectedDefenseObjective,
    setSelectedNavigationObjective,
    setSelectedShips,
    setShowNotification,
    setTotalShipPoints,
    setTotalSquadronPoints
  ]);

  const handlePrint = () => {
    setShowPrintMenu(true);
  };

  const handlePrintList = () => {
    const printContent = generatePrintContent();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 2500);
    }
    setShowPrintMenu(false);
  };

  const handlePrintnPlay = () => {
    const printContent = generatePrintnPlayContent();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Add event listener for load
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing (optional)
          // printWindow.close();
        }, 2000);
      };
    }
    setShowPrintMenu(false);
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

        .tournament-info {
          margin-top: 1.5em;
          border-top: 1px solid #ddd;
          padding-top: 1.5em;
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
        ${selectedShips.map((ship) => `
          <div class="section">
            <strong>${ship.name}</strong> (${ship.points} points)
            ${ship.assignedUpgrades.map((upgrade) => `
              <div class="upgrade">
                <div style="display: flex; align-items: center; gap: 0.25em;">
                  <img src="/icons/${upgrade.type}.svg" style="width: 16px; height: 16px;"/>
                  ${upgrade.name} (${upgrade.points} points)
                </div>
              </div>
            `).join("")}
            <div><strong>Total:</strong> ${ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0)} points</div>
          </div>
        `).join("")}
      </div>

      ${selectedSquadrons.length > 0 ? `
        <div class="grid">
          ${selectedSquadrons.map((squadron) => `
            <div class="section">
              <strong>${squadron["ace-name"] || squadron.name}</strong> (${squadron.points} points)${squadron.count > 1 ? ` x${squadron.count}` : ""}
            </div>
          `).join("")}
        </div>
      ` : ''}

      ${showPrintObjectives ? `
        <div class="objectives">
          <div class="objective-card">
            <h4>Assault</h4>
            <p>${selectedAssaultObjective ? selectedAssaultObjective.name : "None"}</p>
          </div>
          <div class="objective-card">
            <h4>Defense</h4>
            <p>${selectedDefenseObjective ? selectedDefenseObjective.name : "None"}</p>
          </div>
          <div class="objective-card">
            <h4>Navigation</h4>
            <p>${selectedNavigationObjective ? selectedNavigationObjective.name : "None"}</p>
          </div>
        </div>
      ` : ''}

      ${tournamentMode && showPrintRestrictions ? `
        <div class="tournament-info">
          <h3>Tournament Restrictions:</h3>
          ${tournamentViolations.length === 0
            ? "<p>This list complies with tournament restrictions.</p>"
            : `
              <p>This list does not comply with tournament restrictions:</p>
              <ul>
                ${tournamentViolations.map((violation) => `<li>${violation}</li>`).join("")}
              </ul>
            `}
        </div>
      ` : ''}
    </body>
    </html>`;

    return content;
  };

  // First, create a helper function to chunk the ships into groups of 4
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // In the generatePrintnPlayContent function, replace the ship cards section with:
  const generatePrintnPlayContent = () => {
    // Calculate number of pages needed for poker cards
    const allCards = [
      ...selectedSquadrons,
      ...selectedShips.flatMap(ship => ship.assignedUpgrades),
      ...[selectedAssaultObjective, selectedDefenseObjective, selectedNavigationObjective].filter((obj): obj is Objective => obj !== null)
    ];
    
    const pokerPagesNeeded = Math.ceil(allCards.length / 9); // 9 cards per page
  
    // Define base token sizes in millimeters (actual physical sizes)
    const baseTokenSizes = {
      small: { width: '38.75mm', height: '70.45mm' },
      medium: { width: '58.5mm', height: '101.5mm' },
      large: { width: '73.0mm', height: '128.5mm' }
    };

    // Helper function to calculate optimal layout
    const calculateOptimalLayout = (ships: Ship[]) => {
      const margin = 0.5; // inches
      const pageWidth = paperSize === 'letter' ? 8.5 : 210/25.4; // convert mm to inches for A4
      const pageHeight = paperSize === 'letter' ? 11 : 297/25.4;
      const usableWidth = pageWidth - (2 * margin);
      const usableHeight = pageHeight - (2 * margin);
      
      // Convert mm to inches with proper sizes
      const tokenSizes = {
        small: { width: 38.75/25.4, height: 70.45/25.4 },
        medium: { width: 58.5/25.4, height: 101.5/25.4 },
        large: { width: 73.0/25.4, height: 128.5/25.4 }
      };

      // Add spacing between tokens (10mm = ~0.394 inches)
      const tokenSpacing = 10/25.4;

      // Sort ships by size (large to small) for better packing
      const sortedShips = [...ships].sort((a, b) => {
        const sizeOrder = { large: 3, medium: 2, small: 1 };
        return sizeOrder[b.size as keyof typeof sizeOrder] - sizeOrder[a.size as keyof typeof sizeOrder];
      });

      const pages: { rows: { ships: Ship[]; height: number }[] }[] = [{ rows: [] }];
      let currentRow: Ship[] = [];
      let currentRowWidth = 0;
      let currentPageHeight = 0;

      sortedShips.forEach(ship => {
        const tokenSize = tokenSizes[ship.size as keyof typeof tokenSizes] || tokenSizes.small;
        const widthWithSpacing = tokenSize.width + tokenSpacing;
        
        if (currentRowWidth + widthWithSpacing > usableWidth && currentRow.length > 0) {
          // Calculate height of current row
          const maxHeight = Math.max(...currentRow.map(s => 
            tokenSizes[s.size as keyof typeof tokenSizes]?.height || tokenSizes.small.height
          ));

          // Check if adding this row would exceed usable height
          if (currentPageHeight + maxHeight + tokenSpacing > usableHeight) {
            // Start new page
            pages.push({ rows: [] });
            currentPageHeight = 0;
          }

          // Add row to current page
          pages[pages.length - 1].rows.push({ ships: currentRow, height: maxHeight });
          currentPageHeight += maxHeight + tokenSpacing;
          
          // Start new row
          currentRow = [];
          currentRowWidth = 0;
        }
        
        currentRow.push(ship);
        currentRowWidth += widthWithSpacing;
      });

      // Handle remaining ships
      if (currentRow.length > 0) {
        const maxHeight = Math.max(...currentRow.map(s => 
          tokenSizes[s.size as keyof typeof tokenSizes]?.height || tokenSizes.small.height
        ));

        if (currentPageHeight + maxHeight + tokenSpacing > usableHeight) {
          pages.push({ rows: [] });
        }

        pages[pages.length - 1].rows.push({ ships: currentRow, height: maxHeight });
      }

      return pages;
    };

    // Generate base tokens
  
    const baseTokensHTML = selectedShips.length > 0 ? calculateOptimalLayout(selectedShips).map(page => `
      <div class="page">
        <div class="base-token-grid" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: ${paperSize === 'letter' ? '11in' : '297mm'};
          width: ${paperSize === 'letter' ? '8.5in' : '210mm'};
          margin: 0;
          padding: 0.5in;
          box-sizing: border-box;
        ">
          ${page.rows.map(row => `
            <div style="
              display: flex; 
              justify-content: center; 
              align-items: center;
              margin-bottom: 10mm;
              width: 100%;
              gap: 4mm;  /* Add horizontal spacing between bases */
            ">
              ${row.ships.map(ship => {
                const baseTokenUrl = ship.cardimage.replace('.webp', '-base.webp');
                return `
                  <div class="base-token" style="
                    width: ${baseTokenSizes[ship.size as keyof typeof baseTokenSizes]?.width || baseTokenSizes.small.width};
                    height: ${baseTokenSizes[ship.size as keyof typeof baseTokenSizes]?.height || baseTokenSizes.small.height};
                    margin: 0;
                  ">
                    <img 
                      src="${baseTokenUrl}" 
                      alt="${ship.name} Base Token" 
                      style="width: 100%; height: 100%; object-fit: contain;"
                    />
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('') : '';
  
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Print & Play - ${fleetName}</title>
          <style>
            @page {
              size: ${paperSize};
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            .page {
              position: relative;
              width: ${paperSize === 'letter' ? '8.5in' : '210mm'};
              height: ${paperSize === 'letter' ? '11in' : '297mm'};
              display: flex;
              justify-content: center;
              align-items: center;
              page-break-after: always;
            }

            .grid {
              display: grid;
            }

            .tarot-grid {
              grid-template-columns: repeat(2, 2.75in);
              grid-template-rows: repeat(2, 4.75in);
              font-size: 0; /* Removes any potential whitespace */
            }

            .poker-grid {
              grid-template-columns: repeat(3, 2.5in);
              grid-template-rows: repeat(3, 3.5in);
              font-size: 0;
              margin: 0.4in;
            }

            .tarot-card {
              width: 2.75in;
              height: 4.75in;
              position: relative;
              overflow: hidden;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .poker-card {
              width: 2.5in;
              height: 3.5in;
              position: relative;
              overflow: hidden;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .card-container {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden; // Add this to ensure the scaled background stays within bounds
            }

            .card-background {
              position: absolute;
              width: 105%;  // Increased from 100% to 105%
              height: 105%; // Increased from 100% to 105%
              top: -2.5%;   // Center the scaled image
              left: -2.5%;  // Center the scaled image
              filter: blur(8px);
              z-index: 1;
              object-fit: cover;
              transform: scale(1.05); // Additional scaling to ensure full coverage
            }

            .card-image {
              position: absolute;
              width: 100%;
              height: 100%;
              object-fit: fill;
              z-index: 2;
            }

          </style>
      </head>
      <body>
        ${selectedShips.length > 0 ? `
          ${chunkArray(selectedShips, 4).map(shipGroup => `
            <!-- Ship Cards Front -->
            <div class="page">
              <div class="grid tarot-grid">
                ${shipGroup.map(ship => `
                  <div class="tarot-card">
                    <div class="card-container">
                      <img class="card-background" src="${ship.cardimage}" alt="" />
                      <img class="card-image" src="${ship.cardimage}" alt="${ship.name}" />
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Ship Cards Back -->
            <div class="page">
              <div class="grid tarot-grid">
                ${shipGroup.slice().reverse().map(ship => `
                  <div class="tarot-card">
                    <div class="card-container">
                      <img class="card-image" 
                          src="https://api.swarmada.wiki/images/${ship.faction}-ship-rear.webp" 
                          alt="${ship.name} back" />
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        ` : ''}

        ${Array.from({ length: pokerPagesNeeded }).map((_, pageIndex) => {
          const startIndex = pageIndex * 9;
          const pageCards = allCards.slice(startIndex, startIndex + 9);

          return pageCards.length > 0 ? `
            <!-- Poker Cards Front -->
            <div class="page">
              <div class="grid poker-grid">
                ${pageCards.map(card => `
                  <div class="poker-card">
                    <div class="card-container">
                      <img class="card-background" src="${card.cardimage}" alt="" />
                      <img class="card-image" src="${card.cardimage}" alt="${card.name}" />
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Poker Cards Back -->
            <div class="page">
              <div class="grid poker-grid">
                ${pageCards.map((card, index) => {
                  // Calculate position in the grid
                  const row = Math.floor(index / 3); // 3 cards per row
                  const col = index % 3;
                  // Reverse the column position while keeping the same row
                  const reversedCol = 2 - col;
                  const reversedIndex = (row * 3) + reversedCol;
                  const reversedCard = pageCards[reversedIndex];

                  if (!reversedCard) return '';

                  let rearImage;
                  if ('squadron_type' in reversedCard) {
                    rearImage = `${reversedCard.faction}-squadron-rear`;
                  } 
                  else if ('restrictions' in reversedCard) {
                    rearImage = `${reversedCard.type}-rear`;
                  }
                  else {
                    rearImage = 'objective-rear';
                  }
                  
                  return `
                    <div class="poker-card">
                      <div class="card-container">
                        <img class="card-image" 
                             src="https://api.swarmada.wiki/images/${rearImage}.webp" 
                             alt="Card back" />
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : '';
        }).join('')}
        ${baseTokensHTML}
      </body>
      </html>
    `;
  };

// ${baseTokensHTML}

  useEffect(() => {
    const savedFleet = localStorage.getItem(`savedFleet_${faction}`);
    const retrievedFromList = document.cookie.includes('retrieved-from-list=true');
  
    if (!hasLoadedPage && savedFleet && selectedShips.length === 0 && selectedSquadrons.length === 0) {
      if (retrievedFromList) {
        handleImportFleet(savedFleet, 'kingston');
        document.cookie = "retrieved-from-list=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      } else {
        setShowRecoveryPopup(true);
      }
      setHasLoadedPage(true);
    }
  }, [faction, selectedShips.length, selectedSquadrons.length, hasLoadedPage, router, handleImportFleet]);

  useEffect(() => {
    if (selectedShips.length > 0 || selectedSquadrons.length > 0) {
      saveFleetToLocalStorage();
    }
  }, [
    selectedShips,
    selectedSquadrons,
    selectedAssaultObjective,
    selectedDefenseObjective,
    selectedNavigationObjective,
    saveFleetToLocalStorage,
  ]);

  useEffect(() => {
    return () => {
      // Reset all state when component unmounts
      setSelectedShips([]);
      setSelectedSquadrons([]);
      setPoints(0);
      setTotalShipPoints(0);
      setTotalSquadronPoints(0);
      setPreviousPoints(0);
      setPreviousShipPoints(0);
      setPreviousSquadronPoints(0);
      setHasCommander(false);
      setDisabledUpgrades({});
      setEnabledUpgrades({});
      setFilledSlots({});
      setSelectedAssaultObjective(null);
      setSelectedDefenseObjective(null);
      setSelectedNavigationObjective(null);
      setUniqueClassNames([]);
      console.log("clearing state");
    };
  }, []);

  const generateUniqueSquadronId = (): string => {
    setSquadronIdCounter(prev => prev + 1);
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `squadron_${squadronIdCounter}_${randomPart}`;
  };

  return (
    <div ref={contentRef} className="max-w-[2000px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
        <div className="mb-2 sm:mb-0 flex items-center justify-start space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print Fleet</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setShowExportPopup(true)}>
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Fleet</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setShowImportWindow(true)}>
                  <Import className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import Fleet</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <SaveFleetButton
                  fleetData={generateExportText()}
                  faction={faction}
                  fleetName={fleetName}
                  commander={selectedShips.find(ship => 
                    ship.assignedUpgrades.some(upgrade => upgrade.type === "commander"))?.assignedUpgrades
                      .find(upgrade => upgrade.type === "commander")?.name || ""}
                  points={points}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Save Fleet</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        <div className="flex-grow logo-font" />
        <PointsDisplay points={points} previousPoints={previousPoints} />
      </div>

      {selectedShips.length > 0 ? (
        <>
          <SectionHeader
            title="Ships"
            points={totalShipPoints}
            previousPoints={previousShipPoints}
            show={true}
            onClearAll={clearAllShips}
            onAdd={handleAddShip}
          />
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 4xl:grid-cols-5 gap-4">
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
          </div>
        </>
      ) : (
        <Card className="mb-4 relative">
          <Button
            className="w-full justify-between bg-white/30 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md text-lg py-6"
            variant="outline"
            onClick={handleAddShip}
          >
            <span className="text-lg">ADD SHIP</span>
          </Button>
          {showFilter && (
            <ShipFilter
              onApplyFilter={setShipFilter}
              onClose={() => setShowFilter(false)}
            />
          )}
        </Card>
      )}

      {selectedSquadrons.length > 0 ? (
        <>
          <SectionHeader
            title="Squadrons"
            points={totalSquadronPoints}
            previousPoints={previousSquadronPoints}
            show={true}
            onClearAll={clearAllSquadrons}
            onAdd={handleAddSquadron}
          />
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
          </div>
        </>
      ) : (
        <Card className="mb-4 relative">
          <Button
            className="w-full justify-between bg-white/30 dark:bg-gray-900/30 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-md text-lg py-6"
            variant="outline"
            onClick={handleAddSquadron}
          >
            <span className="text-lg">ADD SQUADRON</span>
          </Button>
          {showFilter && (
            <SquadronFilter
              onApplyFilter={setSquadronFilter}
              onClose={() => setShowFilter(false)}
            />
          )}
        </Card>
      )}

      <div className="mb-4 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xl">
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
      </div>

      {/* <div className="flex flex-wrap justify-between gap-2">
        <Link href="/">
          <Button variant="outline" className="flex-grow">
            <ArrowLeft className="mr-2 h-4 w-4" /> BACK
          </Button>
        </Link>
      </div> */}

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
          selectedUpgrades={selectedShips.flatMap(
            (ship) => ship.assignedUpgrades
          )}
          shipType={
            selectedShips.find((ship) => ship.id === currentShipId)?.name
          }
          chassis={
            selectedShips.find((ship) => ship.id === currentShipId)?.chassis
          }
          shipSize={
            selectedShips.find((ship) => ship.id === currentShipId)?.size
          }
          shipTraits={
            selectedShips.find((ship) => ship.id === currentShipId)?.traits
          }
          currentShipUpgrades={
            selectedShips.find((ship) => ship.id === currentShipId)
              ?.assignedUpgrades || []
          }
          disqualifiedUpgrades={disabledUpgrades[currentShipId] || []}
          disabledUpgrades={disabledUpgrades[currentShipId] || []}
          ship={selectedShips.find((ship) => ship.id === currentShipId)!}
        />
      )}

      {showExportPopup && (
        <ExportTextPopup
          text={generateExportText()}
          onClose={() => setShowExportPopup(false)}
          contentRef={contentRef}
        />
      )}

      {showImportWindow && (
        <TextImportWindow
          onImport={handleImportFleet}
          onClose={() => setShowImportWindow(false)}
        />
      )}

      {showNotification && (
        <NotificationWindow
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}

      {showRecoveryPopup && (
        <FleetRecoveryPopup
          isOpen={showRecoveryPopup}
          onImport={handleRecoverFleet}
          onDecline={handleDeclineRecovery}
        />
      )}

    {showPrintMenu && (
      <PrintMenu
        onPrintList={handlePrintList}
        onPrintnPlay={handlePrintnPlay}
        onClose={() => setShowPrintMenu(false)}
        paperSize={paperSize}
        setPaperSize={setPaperSize}
        showRestrictions={showPrintRestrictions}
        setShowRestrictions={setShowPrintRestrictions}
        showObjectives={showPrintObjectives}
        setShowObjectives={setShowPrintObjectives}
      />
    )}
    </div>
  );
}
