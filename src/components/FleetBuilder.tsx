/* eslint-disable @typescript-eslint/no-empty-interface */
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Printer,
  Share2,
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
import { ExpansionSelector } from "./ExpansionSelector";
import Cookies from 'js-cookie';
import { checkFleetViolations, Gamemode } from "../utils/gamemodeRestrictions";
import { GAMEMODE_RESTRICTIONS, getRestrictionsForGamemode } from "../utils/gamemodeRestrictions";
import { forceReloadContent } from "../utils/contentManager";
import { useUser } from '@auth0/nextjs-auth0/client';
import { supabase } from '../lib/supabase';
import { getContentTypes } from './FleetList';
import { FleetNamePrompt } from './FleetNamePrompt';

const DAMAGE_DECK = [
  { name: 'Blinded Gunners', count: 2 },
  { name: 'Capacitor Failure', count: 2 },
  { name: 'Compartment Fire', count: 2 },
  { name: 'Comm Noise', count: 2 },
  { name: 'Coolant Discharge', count: 2 },
  { name: 'Crew Panic', count: 2 },
  { name: 'Damaged Controls', count: 2 },
  { name: 'Damaged Munitions', count: 2 },
  { name: 'Depowered Armament', count: 2 },
  { name: 'Disengaged Fire Control', count: 2 },
  { name: 'Faulty Countermeasures', count: 2 },
  { name: 'Injured Crew', count: 4 },
  { name: 'Life Support Failure', count: 2 },
  { name: 'Point-Defense Failure', count: 2 },
  { name: 'Power Failure', count: 2 },
  { name: 'Projector Misaligned', count: 2 },
  { name: 'Ruptured Engine', count: 2 },
  { name: 'Shield Failure', count: 2 },
  { name: 'Structural Damage', count: 8 },
  { name: 'Targeter Disruption', count: 2 },
  { name: 'Thrust-Control Malfunction', count: 2 },
  { name: 'Thruster Fissure', count: 2 }
];

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
  size: "small" | "medium" | "large" | "huge" | "280-huge";
  traits?: string[];
  source: ContentSource;
  searchableText: string;
  release?: string;
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
  unique_limit?: number;
  source: ContentSource;
  searchableText: string;
  release?: string;
  keywords?: string[]; // Derived from abilities
  assignedUpgrades?: Upgrade[]; // Add support for squadron upgrades (leaders)
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
    grey_upgrades?: string[]; // Add this new property
    size?: string[];
    traits?: string[];
    keywords?: string[]; // Add keyword restrictions for squadrons
    "disallowed-keywords"?: string[]; // Add disallowed keyword restrictions for squadrons
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
  release?: string;
}

export interface Ship extends ShipModel {
  id: string;
  availableUpgrades: string[];
  assignedUpgrades: Upgrade[];
  searchableText: string;
}

export type ContentSource = "regular" | "legacy" | "legends" | "legacyBeta" | "arc" | "arcBeta" | "community" | "amg" | "nexus" | "naboo";

const SectionHeader = ({
  title,
  points,
  previousPoints,
  onClearAll,
  onAdd,
  pointsLimit,
}: {
  title: string;
  points: number;
  previousPoints: number;
  show: boolean;
  onClearAll: () => void;
  onAdd: () => void;
  pointsLimit: number;
}) => (
  <Card className="mb-4 relative">
    <Button
      className="w-full justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30 text-lg py-6"
      variant="outline"
      onClick={onAdd}
    >
      <span className="flex items-center text-l">ADD {title.toUpperCase()}</span>
      <span className="flex items-center">
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          className="mr-2 text-red-500 hover:text-opacity-70 cursor-pointer p-1"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onClearAll();
            }
          }}
        >
          <Trash2 size={16} />
        </div>
        <PointsDisplay points={points} previousPoints={previousPoints} pointsLimit={pointsLimit} showWarning={points > pointsLimit} />
      </span>
    </Button>
  </Card>
);

export default function FleetBuilder({
  faction,
  fleetName,
  setFleetName,
  gamemode,
}: {
  faction: string;
  factionColor: string;
  fleetName: string;
  setFleetName: React.Dispatch<React.SetStateAction<string>>;
  gamemode: string;
}) {
  const { user } = useUser();
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previousShipPoints, setPreviousShipPoints] = useState(0);
  const [previousSquadronPoints, setPreviousSquadronPoints] = useState(0);
  const {} = useTheme();
  const [showAssaultObjectiveSelector, setShowAssaultObjectiveSelector] =
    useState(false);
  const [showDefenseObjectiveSelector, setShowDefenseObjectiveSelector] =
    useState(false);
  const [showNavigationObjectiveSelector, setShowNavigationObjectiveSelector] =
    useState(false);
  const [showCampaignObjectiveSelector, setShowCampaignObjectiveSelector] =
    useState(false);
  const [showSkirmishObjectiveSelector, setShowSkirmishObjectiveSelector] =
    useState(false);
  const [showSkirmish2ObjectiveSelector, setShowSkirmish2ObjectiveSelector] =
    useState(false);
  const [selectedAssaultObjectives, setSelectedAssaultObjectives] = useState<ObjectiveModel[]>([]);
  const [selectedDefenseObjectives, setSelectedDefenseObjectives] = useState<ObjectiveModel[]>([]);
  const [selectedNavigationObjectives, setSelectedNavigationObjectives] = useState<ObjectiveModel[]>([]);
  const [selectedCampaignObjectives, setSelectedCampaignObjectives] = useState<ObjectiveModel[]>([]);
  const [selectedSkirmishObjectives, setSelectedSkirmishObjectives] = useState<ObjectiveModel[]>([]);
  const [selectedSkirmish2Objectives, setSelectedSkirmish2Objectives] = useState<ObjectiveModel[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uniqueClassNames, setUniqueClassNames] = useState<string[]>([]);
  const [showUpgradeSelector, setShowUpgradeSelector] = useState(false);
  const [currentUpgradeType, setCurrentUpgradeType] = useState("");
  const [currentShipId, setCurrentShipId] = useState("");
  const [currentSquadronId, setCurrentSquadronId] = useState("");
  const [showExportPopup, setShowExportPopup] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { addUniqueClassName, removeUniqueClassName, resetUniqueClassNames } = useUniqueClassContext();
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
  const [showImportWindow, setShowImportWindow] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showShareNamePrompt, setShowShareNamePrompt] = useState(false);

  const [shipIdCounter, setShipIdCounter] = useState(0);
  const [showRecoveryPopup, setShowRecoveryPopup] = useState(false);
  const [hasLoadedPage, setHasLoadedPage] = useState(false);
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [paperSize, setPaperSize] = useState<'letter' | 'a4'>('letter');
  const [showPrintRestrictions, setShowPrintRestrictions] = useState(true);
  const [showPrintObjectives, setShowPrintObjectives] = useState(true);
  const [isExpansionMode, setIsExpansionMode] = useState(false);
  const [showCardBacks, setShowCardBacks] = useState(false);
  const [showDamageDeck, setShowDamageDeck] = useState(false);
  const [expandCardBacks, setExpandCardBacks] = useState(false);
  const [showDeleteShipsConfirmation, setShowDeleteShipsConfirmation] = useState(false);
  const [showDeleteSquadronsConfirmation, setShowDeleteSquadronsConfirmation] = useState(false);
  const [greyUpgrades, setGreyUpgrades] = useState<Record<string, string[]>>({});
  const [isImporting, setIsImporting] = useState(false);

  const commanderCount = useMemo(() => 
    selectedShips
      .flatMap((ship) => ship.assignedUpgrades)
      .filter((upgrade) => upgrade.type === "commander").length,
    [selectedShips]
  );

  const fleetViolations = useMemo(() => checkFleetViolations(
    gamemode as Gamemode,
    {
      points,
      totalSquadronPoints,
      selectedShips,
      selectedSquadrons,
      selectedAssaultObjectives,
      selectedDefenseObjectives,
      selectedNavigationObjectives,
      selectedCampaignObjectives,
      commanderCount,
    },
    faction
  ), [gamemode, points, totalSquadronPoints, selectedShips, selectedSquadrons, selectedAssaultObjectives, selectedDefenseObjectives, selectedNavigationObjectives, selectedCampaignObjectives, commanderCount, faction]);

  // Synchronize total points calculation
  useEffect(() => {
    const calculatedShipPoints = selectedShips.reduce((total, ship) => {
      const shipUpgradePoints = ship.assignedUpgrades.reduce((upgradeTotal, upgrade) => upgradeTotal + upgrade.points, 0);
      return total + ship.points + shipUpgradePoints;
    }, 0);

    const calculatedSquadronPoints = selectedSquadrons.reduce((total, squadron) => {
      const squadronPoints = squadron.points * (squadron.count || 1);
      const upgradePoints = (squadron.assignedUpgrades || []).reduce((upgradeTotal, upgrade) => upgradeTotal + upgrade.points, 0);
      return total + squadronPoints + upgradePoints;
    }, 0);

    const calculatedTotalPoints = calculatedShipPoints + calculatedSquadronPoints;

    // Update previous points before changing current points to enable animation
    setPreviousPoints(points);
    setPreviousShipPoints(totalShipPoints);
    setPreviousSquadronPoints(totalSquadronPoints);

    // Always update the points to ensure they stay in sync
    setTotalShipPoints(calculatedShipPoints);
    setTotalSquadronPoints(calculatedSquadronPoints);
    setPoints(calculatedTotalPoints);
  }, [selectedShips, selectedSquadrons, points, totalShipPoints, totalSquadronPoints]);

  // Function to recalculate disabled upgrades for a specific set of ships (used during import)
  const recalculateDisabledUpgradesForShips = useCallback((ships: Ship[]) => {
    const newDisabledUpgrades: Record<string, string[]> = {};
    const newEnabledUpgrades: Record<string, string[]> = {};
    const newGreyUpgrades: Record<string, string[]> = {};
    const newFilledSlots: Record<string, Record<string, number[]>> = {};

    // Check if any ship has a commander
    const currentlyHasCommander = ships.some(ship => 
      ship.assignedUpgrades.some(upgrade => upgrade.type === "commander")
    );

    ships.forEach(ship => {
      const shipDisabled: string[] = [];
      const shipEnabled: string[] = [];
      const shipGrey: string[] = [];
      const shipSlots: Record<string, number[]> = {};

      // Check commander restrictions
      const shipHasCommander = ship.assignedUpgrades.some(upgrade => upgrade.type === "commander");
      if (currentlyHasCommander && !shipHasCommander) {
        shipDisabled.push("commander");
      }

      // Process each equipped upgrade
      ship.assignedUpgrades.forEach(upgrade => {
        // Handle disabled upgrades
        if (upgrade.restrictions?.disable_upgrades) {
          // Filter out empty strings
          const validDisabledUpgrades = upgrade.restrictions.disable_upgrades.filter(u => u.trim() !== "");
          shipDisabled.push(...validDisabledUpgrades);
        }

        // Handle title restrictions
        if (upgrade.type === "title") {
          shipDisabled.push("title");
        }

        // Handle enabled upgrades (just track them for state)
        if (upgrade.restrictions?.enable_upgrades) {
          shipEnabled.push(...upgrade.restrictions.enable_upgrades);
        }

        // Handle grey upgrades
        if (upgrade.restrictions?.grey_upgrades) {
          shipGrey.push(...upgrade.restrictions.grey_upgrades);
        }

        // Handle filled slots
        const upgradeTypeSlots = shipSlots[upgrade.type] || [];
        const slotIndex = upgrade.slotIndex || 0;
        if (!upgradeTypeSlots.includes(slotIndex)) {
          upgradeTypeSlots.push(slotIndex);
          shipSlots[upgrade.type] = upgradeTypeSlots;
        }
      });

      // Remove duplicates
      newDisabledUpgrades[ship.id] = [...new Set(shipDisabled)];
      newEnabledUpgrades[ship.id] = [...new Set(shipEnabled)];
      newGreyUpgrades[ship.id] = [...new Set(shipGrey)];
      newFilledSlots[ship.id] = shipSlots;
    });

    setDisabledUpgrades(newDisabledUpgrades);
    setEnabledUpgrades(newEnabledUpgrades);
    setGreyUpgrades(newGreyUpgrades);
    setFilledSlots(newFilledSlots);
    setHasCommander(currentlyHasCommander);
  }, []);

  // Function to recalculate disabled upgrades based on currently equipped upgrades (for page refresh/import)
  const recalculateDisabledUpgrades = useCallback(() => {
    recalculateDisabledUpgradesForShips(selectedShips);
  }, [selectedShips, recalculateDisabledUpgradesForShips]);

  // Throttled version of recalculation to prevent excessive calls
  const lastRecalculationTime = useRef<number>(0);
  const recalculateDisabledUpgradesThrottled = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRecalculation = now - lastRecalculationTime.current;
    
    // Only recalculate if it's been more than 2 seconds since the last recalculation
    if (timeSinceLastRecalculation > 2000) {
      lastRecalculationTime.current = now;
      recalculateDisabledUpgrades();
    }
  }, [recalculateDisabledUpgrades]);

  // Detect when ships with disabling upgrades appear but no disabled upgrades are set
  useEffect(() => {
    // Don't run recalculation during import operations
    if (isImporting) {
      return;
    }

    const hasShipsWithDisablingUpgrades = selectedShips.some(ship => 
      ship.assignedUpgrades.some(upgrade => 
        upgrade.restrictions?.disable_upgrades || upgrade.type === "title"
      )
    );
    
    if (hasShipsWithDisablingUpgrades) {
      // Check for meaningful disabled upgrades (not empty strings)
      const hasAnyDisabledUpgrades = Object.values(disabledUpgrades).some(disabled => 
        disabled.some(upgrade => upgrade.trim() !== "")
      );
      
      if (!hasAnyDisabledUpgrades) {
        // Throttle the recalculation to avoid excessive runs
        const timeoutId = setTimeout(() => {
          recalculateDisabledUpgradesThrottled();
        }, 1500); // Wait 1.5 seconds before recalculating
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedShips, disabledUpgrades, recalculateDisabledUpgradesThrottled, isImporting]);



  // Synchronize hasCommander state and disable commander slots on other ships
  useEffect(() => {
    const currentlyHasCommander = selectedShips.some(ship => 
      ship.assignedUpgrades.some(upgrade => upgrade.type === "commander")
    );
    
    if (currentlyHasCommander !== hasCommander) {
      setHasCommander(currentlyHasCommander);
    }

    // Update disabled upgrades for commander slots
    setDisabledUpgrades(prevDisabled => {
      const newDisabledUpgrades = { ...prevDisabled };
      selectedShips.forEach(ship => {
        const shipHasCommander = ship.assignedUpgrades.some(upgrade => upgrade.type === "commander");
        const currentDisabled = newDisabledUpgrades[ship.id] || [];
        
        if (currentlyHasCommander && !shipHasCommander) {
          // Add commander to disabled if another ship has one and this ship doesn't
          if (!currentDisabled.includes("commander")) {
            newDisabledUpgrades[ship.id] = [...currentDisabled, "commander"];
          }
        } else if (!currentlyHasCommander) {
          // Remove commander from disabled if no ship has a commander
          newDisabledUpgrades[ship.id] = currentDisabled.filter(type => type !== "commander");
        }
      });
      
      return newDisabledUpgrades;
    });
  }, [selectedShips, hasCommander]);

  useEffect(() => {
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
            upgrade["unique-class"]
              .filter(uc => uc !== "")
              .forEach(uc => removeUniqueClassName(uc));
          }
        });
      });
      
      selectedSquadrons.forEach(squadron => {
        if (squadron.unique) {
          removeUniqueClassName(squadron.name);
        }
        if (squadron["unique-class"]) {
          squadron["unique-class"]
            .filter(uc => uc !== "")
            .forEach(uc => removeUniqueClassName(uc));
        }
      });
    };
  }, [selectedShips, selectedSquadrons, removeUniqueClassName]);


  const generateUniqueShipId = (): string => {
    const newCounter = shipIdCounter + 1;
    setShipIdCounter(newCounter);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ship_${timestamp}_${newCounter}_${random}`;
  };

  const generateUniqueSquadronId = useCallback((): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `squadron_${timestamp}_${randomNum}`;
  }, []);

  const handleAddShip = () => {
    setShowShipSelector(true);
  };

  const handleSelectShip = (ship: ShipModel) => {
    const newShip: Ship = {
      ...ship,
      id: generateUniqueShipId(),
      availableUpgrades: [...(ship.upgrades || [])], // Create new array
      assignedUpgrades: [],
      chassis: ship.chassis,
      size: (ship.size || "small") as "small" | "medium" | "large" | "huge" | "280-huge",
      traits: ship.traits || [],
      source: ship.source || "regular",
    };
    setSelectedShips([...selectedShips, newShip]);
    setShowShipSelector(false);
  };

  const handleRemoveShip = (id: string) => {
    setSelectedShips((prevShips) => {
      const shipToRemove = prevShips.find((ship) => ship.id === id);
      if (!shipToRemove) {
        return prevShips; // Ship not found, no changes
      }

      // Remove unique class names for the ship and its upgrades
      if (shipToRemove.unique) {
        removeUniqueClassName(shipToRemove.name);
      }
      shipToRemove.assignedUpgrades.forEach((upgrade) => {
        if (upgrade.unique) {
          removeUniqueClassName(upgrade.name);
        }
        if (upgrade["unique-class"]) {
          upgrade["unique-class"]
            .filter(uc => uc !== "")
            .forEach((uc) => removeUniqueClassName(uc));
        }
      });

      const newShips = prevShips.filter((ship) => ship.id !== id);
      
      return newShips;
    });

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
    setFilledSlots((prev) => {
      const newFilled = { ...prev };
      delete newFilled[id];
      return newFilled;
    });
    setGreyUpgrades((prev) => {
      const newGrey = { ...prev };
      delete newGrey[id];
      return newGrey;
    });
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
    // Handle squadron upgrades (leaders) for Fighter Group mode
    if (currentSquadronId) {
      setSelectedSquadrons((prevSquadrons) =>
        prevSquadrons.map((squadron) => {
          if (squadron.id === currentSquadronId) {
            const newUpgrade = { ...upgrade, slotIndex: currentUpgradeIndex };
            const updatedAssignedUpgrades = [...(squadron.assignedUpgrades || [])];
            const existingUpgradeIndex = updatedAssignedUpgrades.findIndex(
              (u) => u.type === currentUpgradeType
            );

            if (existingUpgradeIndex !== -1) {
              // Remove the old unique class name if it exists
              const oldUpgrade = updatedAssignedUpgrades[existingUpgradeIndex];
              if (oldUpgrade.unique) {
                removeUniqueClassName(oldUpgrade.name);
              }
              if (oldUpgrade["unique-class"]) {
                oldUpgrade["unique-class"]
                  .filter(uc => uc !== "")
                  .forEach((uc) => removeUniqueClassName(uc));
              }
              updatedAssignedUpgrades[existingUpgradeIndex] = newUpgrade;
            } else {
              updatedAssignedUpgrades.push(newUpgrade);
            }

            return {
              ...squadron,
              assignedUpgrades: updatedAssignedUpgrades,
            };
          }
          return squadron;
        })
      );
      setShowUpgradeSelector(false);
      setCurrentSquadronId("");
      return;
    }

    // Handle ship upgrades (existing logic)
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
              oldUpgrade["unique-class"]
                .filter(uc => uc !== "")
                .forEach((uc) => removeUniqueClassName(uc));
            }
            updatedAssignedUpgrades[existingUpgradeIndex] = newUpgrade;
          } else {
            updatedAssignedUpgrades.push(newUpgrade);
          }

          // Add new unique class
          if (upgrade.unique) {
            addUniqueClassName(upgrade.name);
          }
          if (upgrade["unique-class"]) {
            upgrade["unique-class"]
              .filter(uc => uc !== "")
              .forEach((uc) => addUniqueClassName(uc));
          }

          // Handle disabled upgrades
          const newDisabledUpgrades = [...(disabledUpgrades[ship.id] || [])];
          if (upgrade.restrictions?.disable_upgrades) {
            // Filter out empty strings
            const validDisabledUpgrades = upgrade.restrictions.disable_upgrades.filter(u => u.trim() !== "");
            newDisabledUpgrades.push(...validDisabledUpgrades);
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

    // Move ship with commander to the front if it's a commander upgrade
    if (upgrade.type === "commander") {
      setSelectedShips(prevShips => {
        const shipIndex = prevShips.findIndex(ship => ship.id === currentShipId);
        if (shipIndex > 0) {
          const newShips = [...prevShips];
          const [shipWithCommander] = newShips.splice(shipIndex, 1);
          newShips.unshift(shipWithCommander);
          return newShips;
        }
        return prevShips;
      });
    }

    setShowUpgradeSelector(false);

    // Handle grey upgrades
    setGreyUpgrades(prevGrey => {
      const newGreyUpgrades = [...(prevGrey[currentShipId] || [])];
      if (upgrade.restrictions?.grey_upgrades) {
        upgrade.restrictions.grey_upgrades.forEach(greyUpgrade => {
          if (!newGreyUpgrades.includes(greyUpgrade)) {
            newGreyUpgrades.push(greyUpgrade);
          }
        });
      }
      return {
        ...prevGrey,
        [currentShipId]: newGreyUpgrades,
      };
    });
  };

  // const handleAddUpgrade = useCallback((shipId: string, upgrade: Upgrade) => {
  //   setSelectedShips((prevShips) =>
  //     prevShips.map((ship) => {
  //       if (ship.id === shipId) {
  //         const exhaustType = upgrade.exhaust?.type || "";
  //         const isModification = upgrade.modification ? "modification" : "";

  //         // Determine the source based on the alias
  //         let source: ContentSource = "regular";
  //         if (upgrade.alias) {
  //           if (upgrade.alias.includes("LegacyBeta")) {
  //             source = "legacyBeta";
  //           } else if (upgrade.alias.includes("Legacy")) {
  //             source = "legacy";
  //           } else if (upgrade.alias.includes("Legends")) {
  //             source = "legends";
  //           } else if (upgrade.alias.includes("ARC")) {
  //             source = "arc";
  //           } else if (upgrade.alias.includes("Nexus")) {
  //             source = "nexus";
  //           }
  //         }

  //         const newUpgrade: Upgrade = {
  //           ...upgrade,
  //           slotIndex: upgrade.slotIndex !== undefined ? upgrade.slotIndex : ship.assignedUpgrades.length,
  //           source: source,
  //           searchableText: JSON.stringify({
  //             ...upgrade,
  //             name: upgrade.name,
  //             ability: upgrade.ability,
  //             exhaustType: exhaustType,
  //             isModification: isModification,
  //           }).toLowerCase(),
  //         };

  //         const updatedAssignedUpgrades = [...ship.assignedUpgrades];
  //         const existingUpgradeIndex = updatedAssignedUpgrades.findIndex(
  //           (u) => u.type === upgrade.type && u.slotIndex === newUpgrade.slotIndex
  //         );

  //         if (existingUpgradeIndex !== -1) {
  //           updatedAssignedUpgrades[existingUpgradeIndex] = newUpgrade;
  //         } else {
  //           updatedAssignedUpgrades.push(newUpgrade);
  //         }

  //         // Add new unique class names using setTimeout to avoid React state updates during render
  //         if (upgrade.unique) {
  //           setTimeout(() => addUniqueClassName(upgrade.name), 0);
  //         }
  //         if (upgrade["unique-class"]) {
  //           upgrade["unique-class"]
  //             .filter(uc => uc !== "")
  //             .forEach((uc) => {
  //               setTimeout(() => addUniqueClassName(uc), 0);
  //             });
  //         }

  //         // Handle disabled upgrades
  //         const newDisabledUpgrades = [...(disabledUpgrades[ship.id] || [])];
  //         if (upgrade.restrictions?.disable_upgrades) {
  //           // Filter out empty strings
  //           const validDisabledUpgrades = upgrade.restrictions.disable_upgrades.filter(u => u.trim() !== "");
  //           newDisabledUpgrades.push(...validDisabledUpgrades);
  //         }
  //         if (upgrade.type === "title") {
  //           newDisabledUpgrades.push("title");
  //         }
  //         setDisabledUpgrades({
  //           ...disabledUpgrades,
  //           [ship.id]: newDisabledUpgrades,
  //         });

  //         // Handle enabled upgrades
  //         const newEnabledUpgrades = [...(enabledUpgrades[ship.id] || [])];
  //         const updatedAvailableUpgrades = [...ship.availableUpgrades];
  //         if (upgrade.restrictions?.enable_upgrades) {
  //           upgrade.restrictions.enable_upgrades
  //             .filter((enabledUpgrade) => enabledUpgrade.trim() !== "")
  //             .forEach((enabledUpgrade) => {
  //               // Only add to availableUpgrades if it's not already there
  //               if (!updatedAvailableUpgrades.includes(enabledUpgrade)) {
  //                 updatedAvailableUpgrades.push(enabledUpgrade);
  //               }
  //               // Track enabled upgrades for state management
  //               if (!newEnabledUpgrades.includes(enabledUpgrade)) {
  //                 newEnabledUpgrades.push(enabledUpgrade);
  //               }
  //             });
  //         }

  //         setEnabledUpgrades({
  //           ...enabledUpgrades,
  //           [ship.id]: newEnabledUpgrades,
  //         });

  //         // Update filledSlots
  //         setFilledSlots((prevFilledSlots) => {
  //           const shipSlots = prevFilledSlots[ship.id] || {};
  //           const upgradeTypeSlots = shipSlots[upgrade.type] || [];
  //           const updatedSlots = [
  //             ...upgradeTypeSlots,
  //             ship.assignedUpgrades.length,
  //           ];
  //           return {
  //             ...prevFilledSlots,
  //             [ship.id]: {
  //               ...shipSlots,
  //               [upgrade.type]: updatedSlots,
  //             },
  //           };
  //         });

  //         // Sort the upgrades based on the order of availableUpgrades
  //         const sortedUpgrades = [...updatedAssignedUpgrades].sort((a, b) => {
  //           const aIndex = ship.availableUpgrades.indexOf(a.type);
  //           const bIndex = ship.availableUpgrades.indexOf(b.type);
  //           return aIndex - bIndex;
  //         });

  //         return {
  //           ...ship,
  //           assignedUpgrades: sortedUpgrades,
  //           availableUpgrades: updatedAvailableUpgrades,
  //         };
  //       }
  //       return ship;
  //     })
  //   );
  //     }, [enabledUpgrades, setEnabledUpgrades, setFilledSlots, addUniqueClassName, disabledUpgrades]);

  const handleRemoveUpgrade = useCallback(
    (shipId: string, upgradeType: string, upgradeIndex: number) => {
      const shipToUpdate = selectedShips.find((ship) => ship.id === shipId);
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
            handleRemoveUpgrade(shipId, flagshipUpgrade.type, flagshipUpgrade.slotIndex || 0);
          }
        });
      }

      // If this is a commander being removed, update hasCommander state immediately
      if (upgradeType === "commander") {
        setHasCommander(false);
      }

      setSelectedShips((prevShips) =>
        prevShips.map((ship) => {
          if (ship.id === shipId) {
            const upgradeToRemove = ship.assignedUpgrades.find(
              (u) => u.type === upgradeType && u.slotIndex === upgradeIndex
            );
            if (upgradeToRemove) {
              let upgradesToRemove = [upgradeToRemove];

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
                  upgrade["unique-class"]
                    .filter(uc => uc !== "")
                    .forEach((uc) => {
                      setTimeout(() => removeUniqueClassName(uc), 0);
                    });
                }

                // Update disabled upgrades
                setDisabledUpgrades((prev) => {
                  const newDisabled = { ...prev };
                  // If this is a commander being removed, ensure commander is removed from disabled upgrades for all ships
                  if (upgrade.type === "commander") {
                    Object.keys(newDisabled).forEach(shipId => {
                      newDisabled[shipId] = (newDisabled[shipId] || []).filter(type => type !== "commander");
                    });
                  } else {
                    // For non-commander upgrades, just remove their specific disabled upgrades
                    newDisabled[shipId] = (newDisabled[shipId] || []).filter(
                      (u) => !upgrade.restrictions?.disable_upgrades?.includes(u)
                    );
                  }
                  return newDisabled;
                });

                // Update enabled upgrades
                setEnabledUpgrades((prev) => ({
                  ...prev,
                  [shipId]: (prev[shipId] || []).filter(
                    (u) => !upgrade.restrictions?.enable_upgrades?.includes(u)
                  ),
                }));

                // Update grey_upgrades properly
                setGreyUpgrades((prev) => {
                  const currentGrey = prev[shipId] || [];
                  const updatedGrey = currentGrey.filter(
                    (u) => !upgrade.restrictions?.grey_upgrades?.includes(u)
                  );
                  return {
                    ...prev,
                    [shipId]: updatedGrey,
                  };
                });

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
          }
          return ship;
        })
      );
    },
    [
      removeUniqueClassName,
      selectedShips,
      setSelectedShips,
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
      size: (freshShipModel.size || "small") as "small" | "medium" | "large" | "huge" | "280-huge",
      searchableText: freshShipModel.searchableText || "",
      source: shipToCopy.source
    };
  

  
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
    });
  
    setSelectedShips((prevShips) => [...prevShips, newShip]);
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
              s["unique-class"]
                .filter(uc => uc !== "")
                .forEach((uc) => removeUniqueClassName(uc));
            }



            // Add unique class names for the new squadron
            if (squadron.unique) {
              addUniqueClassName(squadron.name);
            }
            if (squadron["unique-class"]) {
              squadron["unique-class"]
                .filter(uc => uc !== "")
                .forEach((uc) => addUniqueClassName(uc));
            }

            return { 
              ...squadron, 
              id: generateUniqueSquadronId(), 
              count: 1,
              keywords: extractKeywordsFromAbilities(squadron.abilities) // Ensure keywords are populated
            };
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

  // Add utility function to extract keywords from squadron abilities
  const extractKeywordsFromAbilities = (abilities: Record<string, boolean | number>): string[] => {
    const keywords: string[] = [];
    
    Object.entries(abilities || {}).forEach(([key, value]) => {
      // Only include abilities that are active (true for boolean, > 0 for number)
      if ((typeof value === 'boolean' && value) || (typeof value === 'number' && value > 0)) {
        keywords.push(key);
      }
    });
    
    return keywords;
  };

  const handleAddingSquadron = useCallback((squadron: Squadron) => {
    const squadronId = generateUniqueSquadronId();
    const newSquadron: Squadron = {
      ...squadron,
      id: squadronId,
      count: squadron.count || 1, // Use the count from the passed squadron, default to 1
      source: squadron.source,
      keywords: extractKeywordsFromAbilities(squadron.abilities), // Ensure keywords are populated
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
    // Use setTimeout to avoid React state updates during render
    setTimeout(() => {
      if (squadron.unique) {
        addUniqueClassName(squadron.name);
      }
      if (squadron["unique-class"]) {
        squadron["unique-class"]
          .filter(uc => uc !== "")
          .forEach((uc) => addUniqueClassName(uc));
      }
    }, 0);
    
    return squadronId;
  }, [addUniqueClassName, generateUniqueSquadronId]);

  const handleRemoveSquadron = (id: string) => {
    setSelectedSquadrons((prevSquadrons) => {
      const squadronToRemove = prevSquadrons.find(
        (squadron) => squadron.id === id
      );
      if (!squadronToRemove) {
        return prevSquadrons; // Squadron not found, no changes
      }

      if (squadronToRemove.unique) {
        removeUniqueClassName(squadronToRemove.name);
        if (squadronToRemove["ace-name"]) {
          removeUniqueClassName(squadronToRemove["ace-name"]);
        }
      }
      if (squadronToRemove["unique-class"]) {
        squadronToRemove["unique-class"]
          .filter(uc => uc !== "")
          .forEach((uc) => removeUniqueClassName(uc));
      }

      const newSquadrons = prevSquadrons.filter((squadron) => squadron.id !== id);
      
      return newSquadrons;
    });
  };

  const handleIncrementSquadron = useCallback((id: string) => {
    const squadron = selectedSquadrons.find(s => s.id === id);
    if (!squadron) return;

    // Check if this is a unique squadron with unique_limit > 1
    if (squadron.unique && squadron.unique_limit && squadron.unique_limit > 1) {
      // Count existing squadrons of the same type
      const existingCount = selectedSquadrons.reduce((count, s) => {
        if (s.name === squadron.name) {
          return count + (s.count || 1);
        }
        return count;
      }, 0);

      // Check if we've reached the limit
      if (existingCount >= squadron.unique_limit) {
        return; // Don't increment if at limit
      }

      if (squadron.ace) {
        // For ace squadrons with unique_limit > 1, create a new squadron
        const newSquadron: Squadron = {
          ...squadron,
          id: generateUniqueSquadronId(),
          count: 1,
          keywords: extractKeywordsFromAbilities(squadron.abilities), // Ensure keywords are populated
        };
        
        setSelectedSquadrons((squadrons) => {
          // Find where to insert the new squadron (keep unique squadrons together and sorted)
          const uniqueSquadrons = squadrons.filter(s => s.unique);
          const regularSquadrons = squadrons.filter(s => !s.unique);
          
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
      } else {
        // For non-ace unique squadrons with unique_limit > 1, increment normally
        setSelectedSquadrons((squadrons) =>
          squadrons.map((s) =>
            s.id === id ? { ...s, count: (s.count || 1) + 1 } : s
          )
        );
      }
    } else {
      // Default behavior for non-unique squadrons or unique squadrons without unique_limit > 1
      setSelectedSquadrons((squadrons) =>
        squadrons.map((s) =>
          s.id === id ? { ...s, count: (s.count || 1) + 1 } : s
        )
      );
    }
  }, [selectedSquadrons, setSelectedSquadrons, generateUniqueSquadronId]);

  const handleDecrementSquadron = (id: string) => {
    setSelectedSquadrons((prevSquadrons) => {
      const squadronIndex = prevSquadrons.findIndex(squadron => squadron.id === id);
      if (squadronIndex === -1) {
        return prevSquadrons; // Squadron not found
      }

      const squadron = prevSquadrons[squadronIndex];
      const newCount = (squadron.count || 1) - 1;
      
      if (newCount === 0) {
        // Squadron will be removed
        // Remove unique class names if it's the last squadron
        if (squadron.unique) {
          removeUniqueClassName(squadron.name);
        }
        if (squadron["unique-class"]) {
          squadron["unique-class"]
            .filter(uc => uc !== "")
            .forEach((uc) => removeUniqueClassName(uc));
        }
        
        // Remove the squadron from the array
        const newSquadrons = prevSquadrons.filter((_, index) => index !== squadronIndex);
        
        return newSquadrons;
      } else {
        // Squadron count is decremented
        const newSquadrons = [...prevSquadrons];
        newSquadrons[squadronIndex] = { ...squadron, count: newCount };
        return newSquadrons;
      }
    });
  };

  const handleSwapSquadron = (id: string) => {
    setShowSquadronSelector(true);
    setSquadronToSwap(id);
  };

  const handleSquadronUpgradeClick = (squadronId: string, upgradeType: string) => {
    setCurrentSquadronId(squadronId);
    setCurrentUpgradeType(upgradeType);
    setCurrentUpgradeIndex(0); // Leaders only have one slot
    setShowUpgradeSelector(true);
  };

  const handleRemoveSquadronUpgrade = (squadronId: string, upgradeType: string) => {
    setSelectedSquadrons((prevSquadrons) =>
      prevSquadrons.map((squadron) => {
        if (squadron.id === squadronId) {
          const updatedAssignedUpgrades = (squadron.assignedUpgrades || []).filter(
            (upgrade) => upgrade.type !== upgradeType
          );
          return {
            ...squadron,
            assignedUpgrades: updatedAssignedUpgrades,
          };
        }
        return squadron;
      })
    );
  };

  const handleSelectAssaultObjective = (objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedAssaultObjectives(prev => [...prev, objective]);
    } else {
      setSelectedAssaultObjectives([objective]);
    }
    setShowAssaultObjectiveSelector(false);
  };

  const handleSelectDefenseObjective = (objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedDefenseObjectives(prev => [...prev, objective]);
    } else {
      setSelectedDefenseObjectives([objective]);
    }
    setShowDefenseObjectiveSelector(false);
  };

  const handleSelectNavigationObjective = (objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedNavigationObjectives(prev => [...prev, objective]);
    } else {
      setSelectedNavigationObjectives([objective]);
    }
    setShowNavigationObjectiveSelector(false);
  };

  const handleRemoveAssaultObjective = () => {
    setSelectedAssaultObjectives([]);
  };

  const handleRemoveDefenseObjective = () => {
    setSelectedDefenseObjectives([]);
  };

  const handleRemoveNavigationObjective = () => {
    setSelectedNavigationObjectives([]);
  };

  const handleSelectCampaignObjective = (objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedCampaignObjectives(prev => [...prev, objective]);
    } else {
      setSelectedCampaignObjectives([objective]);
    }
    setShowCampaignObjectiveSelector(false);
  };

  const handleRemoveCampaignObjective = () => {
    setSelectedCampaignObjectives([]);
  };

  const handleSelectSkirmishObjective = (objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedSkirmishObjectives(prev => [...prev, objective]);
    } else {
      setSelectedSkirmishObjectives([objective]);
    }
    setShowSkirmishObjectiveSelector(false);
  };

  const handleRemoveSkirmishObjective = () => {
    setSelectedSkirmishObjectives([]);
  };

  const handleSelectSkirmish2Objective = (objective: ObjectiveModel) => {
    if (faction === "sandbox") {
      setSelectedSkirmish2Objectives(prev => [...prev, objective]);
    } else {
      setSelectedSkirmish2Objectives([objective]);
    }
    setShowSkirmish2ObjectiveSelector(false);
  };

  const handleRemoveSkirmish2Objective = () => {
    setSelectedSkirmish2Objectives([]);
  };

    // Modify the SectionHeader click handlers
  const handleClearAllShips = () => {
    setShowDeleteShipsConfirmation(true);
  };

  const handleClearAllSquadrons = () => {
    setShowDeleteSquadronsConfirmation(true);
  };

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
          upgrade["unique-class"]
            .filter(uc => uc !== "")
            .forEach((uc) => removeUniqueClassName(uc));
        }
      });
    });

    setSelectedShips([]);
    setTotalShipPoints(0);
    setPreviousShipPoints(0);
    setDisabledUpgrades({});
    setEnabledUpgrades({});
    setFilledSlots({});
    setGreyUpgrades({});
    localStorage.removeItem(`savedFleet_${faction}`);
      }, [removeUniqueClassName, faction, selectedShips]);

  const clearAllSquadrons = useCallback(() => {
    selectedSquadrons.forEach((squadron) => {
      if (squadron.unique) {
        removeUniqueClassName(squadron.name);
      }
      if (squadron["unique-class"]) {
        squadron["unique-class"]
          .filter(uc => uc !== "")
          .forEach((uc) => removeUniqueClassName(uc));
      }
    });

    setTotalSquadronPoints(0);
    setPreviousSquadronPoints(0);
    setSelectedSquadrons([]);
    localStorage.removeItem(`savedFleet_${faction}`);
  }, [removeUniqueClassName, faction]);

  const handleMoveShip = (id: string, direction: 'up' | 'down') => {
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
  };

  const handleMoveSquadron = (id: string, direction: 'up' | 'down') => {
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
  };

  // Add this helper function to format the objective source
  const formatSource = (source: ContentSource) => {
    switch (source) {
      case 'legacy':
        return '[Legacy]';
      case 'legends':
        return '[Legends]';
      case 'legacyBeta':
        return '[LegacyBeta]';
      case 'arc':
        return '[ARC]';
      case 'arcBeta':
        return '[ARCBeta]';
      case 'nexus':
        return '[Nexus]';
      case 'naboo':
        return '[Naboo]';
      default:
        return '';
    }
  };

  const generateExportText = useCallback(() => {
    // Get gamemode restrictions for export modifications
    const restrictions = getRestrictionsForGamemode(gamemode as Gamemode);
    const exportMods = restrictions?.exportTextModifications;
    
    // Get faction-specific modifications if available
    const factionSpecificMods = exportMods?.factionSpecific?.[faction];
    
    // Helper function to merge global and faction-specific lines
    const getLines = (section: 'afterHeader' | 'afterCommander' | 'afterObjectives' | 'afterShips' | 'afterSquadrons' | 'beforeTotal'): string[] => {
      const globalLines = exportMods?.additionalLines?.[section] || [];
      const factionLines = factionSpecificMods?.additionalLines?.[section] || [];
      return [...globalLines, ...factionLines];
    };
    
    // Get squadron suffix (faction-specific overrides global)
    const squadronSuffix = factionSpecificMods?.squadronSuffix || exportMods?.squadronSuffix || "";

    let text = " Name: " + fleetName + "\n";
    text += "Faction: " + faction.charAt(0).toUpperCase() + faction.slice(1) + "\n";
    
    // Add gamemode if it's not Standard
    if (gamemode && gamemode !== "Standard") {
      text += "Gamemode: " + gamemode + "\n";
    }

    // Add custom lines after header
    getLines('afterHeader').forEach(line => {
      text += line + "\n";
    });

    // Handle commander
    const commander = selectedShips
      .flatMap((ship) => ship.assignedUpgrades)
      .find((upgrade) => upgrade.type === "commander");
    if (commander) {
      const sourceSpace = commander.release === "AMG Final Errata" ? "" : " ";
      text += "Commander: " + commander.name + 
        (commander.source && commander.source !== "regular" ? sourceSpace + formatSource(commander.source) : "") + 
        " (" + commander.points + ")\n";
    }

    // Add custom lines after commander
    getLines('afterCommander').forEach(line => {
      text += line + "\n";
    });

    text += '\n';

    // Add objectives
    if (selectedAssaultObjectives.length > 0) {
      const sourceTag = formatSource(selectedAssaultObjectives[0].source);
      text += `Assault: ${selectedAssaultObjectives.map(obj => obj.name).join(", ")}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }
    if (selectedDefenseObjectives.length > 0) {
      const sourceTag = formatSource(selectedDefenseObjectives[0].source);
      text += `Defense: ${selectedDefenseObjectives.map(obj => obj.name).join(", ")}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }
    if (selectedNavigationObjectives.length > 0) {
      const sourceTag = formatSource(selectedNavigationObjectives[0].source);
      text += `Navigation: ${selectedNavigationObjectives.map(obj => obj.name).join(", ")}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }
    if (selectedCampaignObjectives.length > 0) {
      const sourceTag = formatSource(selectedCampaignObjectives[0].source);
      text += `Campaign: ${selectedCampaignObjectives.map(obj => obj.name).join(", ")}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }
    if (selectedSkirmishObjectives.length > 0) {
      const sourceTag = formatSource(selectedSkirmishObjectives[0].source);
      text += `Skirmish: ${selectedSkirmishObjectives.map(obj => obj.name).join(", ")}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }
    if (selectedSkirmish2Objectives.length > 0) {
      const sourceTag = formatSource(selectedSkirmish2Objectives[0].source);
      text += `Skirmish: ${selectedSkirmish2Objectives.map(obj => obj.name).join(", ")}${sourceTag ? ` ${sourceTag}` : ''}\n`;
    }

    // Add custom lines after objectives
    getLines('afterObjectives').forEach(line => {
      text += line + "\n";
    });

    // Add extra newline after objectives if no ships are present
    if (selectedShips.length === 0) {
      text += "\n";
    }

    // Add ships and their upgrades
    if (selectedShips.length > 0) {
      text += "\n";
      selectedShips.forEach((ship) => {
        const sourceSpace = ship.release === "AMG Final Errata" ? "" : " ";
        text += ship.name + 
          (ship.source && ship.source !== "regular" ? sourceSpace + formatSource(ship.source) : "") + 
          " (" + ship.points + ")\n";

        ship.assignedUpgrades.forEach((upgrade) => {
          const sourceSpace = upgrade.release === "AMG Final Errata" ? "" : " ";
          text += "• " + upgrade.name + 
            (upgrade.source && upgrade.source !== "regular" ? sourceSpace + formatSource(upgrade.source) : "") + 
            " (" + upgrade.points + ")\n";
        });

        text += "= " + 
          (ship.points + 
          ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0)) + 
          " Points\n\n";
      });
    }

    // Add custom lines after ships
    getLines('afterShips').forEach(line => {
      text += line + "\n";
    });

    text += "Squadrons:\n";
    if (selectedSquadrons.length > 0) {
      // For Fighter Group gamemode, handle squadrons individually to show leaders
      if (gamemode === "Fighter Group") {
        selectedSquadrons.forEach((squadron) => {
          const sourceSpace = squadron.release === "AMG Final Errata" ? "" : " ";
          const squadronPoints = squadron.points * (squadron.count || 1);
          const leaderPoints = (squadron.assignedUpgrades || [])
            .filter(upgrade => upgrade.type === "leader")
            .reduce((total, upgrade) => total + upgrade.points, 0);
          const totalSquadronPoints = squadronPoints + leaderPoints;

          if (squadron.unique || squadron["ace-name"]) {
            text += "• " + (squadron["ace-name"] || squadron.name) + 
              " - " + squadron.name + 
              (squadron.source && squadron.source !== "regular" && squadron.source !== "amg" 
                ? sourceSpace + formatSource(squadron.source) 
                : "") + 
              " (" + totalSquadronPoints + ")" + squadronSuffix + "\n";
          } else {
            const count = squadron.count || 1;
            text += "• " + (count > 1 ? count + " x " : "") + squadron.name + 
              (squadron.source && squadron.source !== "regular" && squadron.source !== "amg"
                ? sourceSpace + formatSource(squadron.source) 
                : "") + 
              " (" + totalSquadronPoints + ")" + squadronSuffix + "\n";
          }

          // Add leader upgrades
          (squadron.assignedUpgrades || [])
            .filter(upgrade => upgrade.type === "leader")
            .forEach(leader => {
              const leaderSourceSpace = leader.release === "AMG Final Errata" ? "" : " ";
              text += "• " + leader.name + 
                (leader.source && leader.source !== "regular" 
                  ? leaderSourceSpace + formatSource(leader.source) 
                  : "") + 
                " (" + leader.points + ")\n";
            });
        });
      } else {
        // Standard squadron grouping for other game modes
        const groupedSquadrons = selectedSquadrons.reduce((acc, squadron) => {
          const sourceSpace = squadron.release === "AMG Final Errata" ? "" : " ";
          // Create a base key without points for grouping
          const baseKey =
            squadron.unique || squadron["ace-name"]
              ? (squadron["ace-name"] || squadron.name) + 
                " - " + squadron.name + 
                (squadron.source && squadron.source !== "regular" && squadron.source !== "amg" 
                  ? sourceSpace + formatSource(squadron.source) 
                  : "")
              : squadron.name + 
                (squadron.source && squadron.source !== "regular" && squadron.source !== "amg"
                  ? sourceSpace + formatSource(squadron.source) 
                  : "");
          
          if (!acc[baseKey]) {
            acc[baseKey] = {
              count: 0,
              isUnique: squadron.unique || !!squadron["ace-name"],
              points: squadron.points,
            };
          }
          acc[baseKey].count += squadron.count || 1;
          return acc;
        }, {} as Record<string, { count: number; isUnique: boolean; points: number }>);

        Object.entries(groupedSquadrons).forEach(
          ([baseKey, { count, points }]) => {
            // Calculate total points and create the display key
            const totalPoints = points * count;
            const displayKey = baseKey + " (" + totalPoints + ")";
            
            if (count > 1) {
              text += "• " + count + " x " + displayKey + squadronSuffix + "\n";
            } else {
              text += "• " + displayKey + squadronSuffix + "\n";
            }
          }
        );
      }
    }
    text += "= " + totalSquadronPoints + " Points\n\n";

    // Add custom lines after squadrons
    getLines('afterSquadrons').forEach(line => {
      text += line + "\n";
    });

    // Add custom lines before total
    getLines('beforeTotal').forEach(line => {
      text += line + "\n";
    });

    text += "Total Points: " + points;

    // Ensure the text is not URL encoded
    return decodeURIComponent(encodeURIComponent(text));
  }, [
    selectedShips, 
    selectedSquadrons, 
    selectedAssaultObjectives, 
    selectedDefenseObjectives, 
    selectedNavigationObjectives,
    selectedCampaignObjectives,
    selectedSkirmishObjectives,
    selectedSkirmish2Objectives,
    faction,
    fleetName,
    points,
    totalSquadronPoints,
    gamemode,
    formatSource
  ]);

  const saveFleetToLocalStorage = useCallback(() => {
    const exportText = generateExportText();
    localStorage.setItem(`savedFleet_${faction}`, exportText);
  }, [faction, generateExportText]);
  
  const handleRecoverFleet = async () => {
    const savedFleet = localStorage.getItem(`savedFleet_${faction}`);
    if (savedFleet) {
      await handleImportFleet(savedFleet, 'kingston');
    }
    setShowRecoveryPopup(false);
  };
  
  const handleDeclineRecovery = () => {
    localStorage.removeItem(`savedFleet_${faction}`);
    setShowRecoveryPopup(false);
  };

  const getAliasKey = (
    aliases: Record<string, string | string[]>,
    name: string
  ): string | undefined => {
    console.log(`Getting alias key for: ${name}`);
    console.log(`Aliases:`, aliases);

    const aliasKeys = aliases[name];
    
    // If there's no value or it's a string, return as before
    if (!aliasKeys || typeof aliasKeys === 'string') {
      console.log(`Alias key result:`, aliasKeys);
      return aliasKeys;
    }

    // Now TypeScript knows aliasKeys is string[]
    // First try to find a key that ends with just '-errata'
    const simpleErrata = aliasKeys.find((key: string) => key.endsWith('-errata'));
    if (simpleErrata) {
      console.log(`Found simple errata key:`, simpleErrata);
      return simpleErrata;
    }

    // If no simple errata found, return the first key
    console.log(`No simple errata found, using first key:`, aliasKeys[0]);
    return aliasKeys[0];
  };

  const fetchObjective = (key: string): ObjectiveModel | null => {
    const cacheKey = `objective_${key}`;
    
    // Check cache first
    if (storageCache.has(cacheKey)) {
      return storageCache.get(cacheKey);
    }

    console.log(`Fetching objective for key: ${key}`);
    
    // Define objective storage keys to check
    const objectiveStorageKeys = [
      'objectives',
      'arcObjectives',
      'legacyObjectives',
      'legendsObjectives',
      'legacyBetaObjectives',
      'nexusObjectives'
    ];
    
    // Search through all objective-related localStorage items
    for (const storageKey of objectiveStorageKeys) {
      const rawData = localStorage.getItem(storageKey);
      if (!rawData) continue;

      try {
        const data = JSON.parse(rawData);
        
        // Handle both direct objectives and nested objectives structure
        const objectivesData = data.objectives || data;
        
        // Check if the objective exists in this data
        if (objectivesData[key]) {
          const objective = {
            ...objectivesData[key],
            // Set source based on storage key
            source: storageKey.includes('arc') ? 'arc' :
                   storageKey.includes('legacyBeta') ? 'legacyBeta' :
                   storageKey.includes('legacy') ? 'legacy' :
                   storageKey.includes('legends') ? 'legends' :
                   storageKey.includes('nexus') ? 'nexus' : 'regular'
          } as ObjectiveModel;
          
          // Cache the result
          storageCache.set(cacheKey, objective);
          return objective;
        }
      } catch (error) {
        console.error(`Error parsing JSON for key ${storageKey}:`, error);
      }
    }
    
    // Cache null result
    storageCache.set(cacheKey, null);
    return null;
  };
  
  // Optimized localStorage fetching with caching
  const storageCache = useMemo(() => new Map(), []);
  
  const fetchFromLocalStorage = useCallback((
    key: string,
    type: "ships" | "upgrades" | "squadrons"
  ) => {
    const cacheKey = `${type}_${key}`;
    
    // Check cache first
    if (storageCache.has(cacheKey)) {
      return storageCache.get(cacheKey);
    }

    console.log(`Fetching ${type} for key: ${key}`);
    
    // Define storage keys to check based on type
    const storageKeysToCheck = [
      type, // regular
      `legacy${type.charAt(0).toUpperCase() + type.slice(1)}`,
      `legends${type.charAt(0).toUpperCase() + type.slice(1)}`,
      `legacyBeta${type.charAt(0).toUpperCase() + type.slice(1)}`,
      `arc${type.charAt(0).toUpperCase() + type.slice(1)}`,
      `nexus${type.charAt(0).toUpperCase() + type.slice(1)}`,
      `amg${type.charAt(0).toUpperCase() + type.slice(1)}`
    ];

    for (const storageKey of storageKeysToCheck) {
      const rawData = localStorage.getItem(storageKey);
      if (!rawData) continue;

      try {
        const data = JSON.parse(rawData);
        const itemsData = data[type] || data;

        if (type === "ships") {
          for (const chassisKey in itemsData) {
            const chassis = itemsData[chassisKey];
            const models = chassis.models;
            if (models && models[key]) {
              const item = {
                ...models[key],
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
                        storageKey.includes('legacyBeta') ? 'legacyBeta' :
                        storageKey.includes('legacy') ? 'legacy' :
                        storageKey.includes('legends') ? 'legends' :
                        storageKey.includes('nexus') ? 'nexus' :
                        storageKey.includes('amg') ? 'amg' : 'regular'
              };
              
              // Cache the result
              storageCache.set(cacheKey, item);
              return item;
            }
          }
        } else {
          if (itemsData[key]) {
            const item = {
              ...itemsData[key],
              source: storageKey.includes('arc') ? 'arc' :
                      storageKey.includes('legacyBeta') ? 'legacyBeta' :
                      storageKey.includes('legacy') ? 'legacy' :
                      storageKey.includes('legends') ? 'legends' :
                      storageKey.includes('nexus') ? 'nexus' :
                      storageKey.includes('amg') ? 'amg' : 'regular'
            };
            
            // Cache the result
            storageCache.set(cacheKey, item);
            return item;
          }
        }
      } catch (error) {
        console.error(`Error parsing JSON for key ${storageKey}:`, error);
      }
    }
    
    // Cache null result to avoid repeated lookups
    storageCache.set(cacheKey, null);
    return null;
  }, [storageCache]);

  // Cache the results
  const cachedResults = useMemo(() => {
    return {
      ships: new Map(),
      upgrades: new Map(),
      squadrons: new Map()
    };
  }, []);

  // Use the cache in your fetch functions
  const fetchShip = useCallback((key: string): ShipModel | null => {
    if (cachedResults.ships.has(key)) {
      return cachedResults.ships.get(key);
    }
    const result = fetchFromLocalStorage(key, "ships");
    if (result) {
      cachedResults.ships.set(key, result);
    }
    return result;
  }, [fetchFromLocalStorage, cachedResults]);

  const fetchUpgrade = useCallback((key: string): Upgrade | null => {
    return fetchFromLocalStorage(key, "upgrades") as Upgrade | null;
  }, [fetchFromLocalStorage]);

  const fetchSquadron = useCallback((key: string): Squadron | null => {
    return fetchFromLocalStorage(key, "squadrons") as Squadron | null;
  }, [fetchFromLocalStorage]);

  type FleetFormat = 'kingston' | 'afd' | 'warlords' | 'starforge';


  const preprocessFleetText = useCallback((text: string, format: FleetFormat): string => {
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
            .replace(/^(Assault|Defense|Navigation|Campaign|Skirmish) Objective:/, '$1:');
          
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
  }, []);

  const applyUpdates = useCallback((fleetData: string): string => {
    try {
      // Get updates from localStorage
      const updates = JSON.parse(localStorage.getItem('updates') || '{}');
      
      // Split the fleet data into lines for more precise replacement
      let lines = fleetData.split('\n');
      
      lines = lines.map(line => {
        // Try to match each update pattern
        Object.entries(updates).forEach(([oldName, newName]) => {
          if (typeof newName === 'string') {
            // Create a more precise regex that matches the exact upgrade string
            // This handles the case with or without a bullet point
            const regex = new RegExp(`^(•\\s*)?${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
            if (regex.test(line.trim())) {
              // If bullet point exists, preserve it
              const bulletPoint = line.startsWith('•') ? '• ' : '';
              line = `${bulletPoint}${newName}`;
            }
          }
        });
        return line;
      });

      return lines.join('\n');
    } catch (error) {
      console.error('Error applying updates:', error);
      return fleetData;
    }
  }, []);

  const handleImportFleet = useCallback(async (importText: string, format: FleetFormat) => {
    console.log("Starting fleet import with format:", format);
    
    // Set import flag to prevent automatic recalculations
    setIsImporting(true);
    
    // Load aliases first
    const aliases = JSON.parse(localStorage.getItem("aliases") || "{}");
    const processedText = preprocessFleetText(importText, format);
    console.log("Preprocessed fleet text:", processedText);
    
    // Then apply any card updates
    const updatedFleetText = applyUpdates(processedText);
    console.log("Updated fleet text:", updatedFleetText);
    
    // Use the updated text for the rest of the import process
    const lines = updatedFleetText.split("\n");

    // Check if gamemode is specified in the import, if not set default to Standard
    const gamemodeLineExists = lines.some(line => line.startsWith("Gamemode:"));
    if (!gamemodeLineExists) {
      console.log("No gamemode found in import, defaulting to Standard");
      localStorage.setItem('selectedGamemode', 'Standard');
      
      // Explicitly reset any forced toggles from previous gamemode
      const standardRestrictions = getRestrictionsForGamemode('Standard' as Gamemode);
      if (standardRestrictions?.forceToggles) {
        console.log("Applying Standard gamemode toggles...");
        Object.entries(standardRestrictions.forceToggles).forEach(([key, value]) => {
          if (value !== undefined) {
            Cookies.set(`enable${key.charAt(0).toUpperCase()}${key.slice(1)}`, value.toString(), { expires: 365 });
          }
        });
        
        // Force reload content with new toggles
        await forceReloadContent(() => {}, () => {}, () => {});
        console.log("Standard gamemode content loaded");
        
        // Reload aliases after content reload since they were cleared
        const reloadedAliases = JSON.parse(localStorage.getItem("aliases") || "{}");
        Object.assign(aliases, reloadedAliases);
      }
    }

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
        setIsImporting(false);
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
      setIsImporting(false);
      return;
    }

    const skippedItems: string[] = [];

    // Reset the fleet immediately and synchronously
    console.log("Resetting fleet...");
    
    // Clear unique class names for existing fleet before clearing
    selectedShips.forEach((ship) => {
      if (ship.unique) {
        removeUniqueClassName(ship.name);
      }
      ship.assignedUpgrades.forEach((upgrade) => {
        if (upgrade.unique) {
          removeUniqueClassName(upgrade.name);
        }
        if (upgrade["unique-class"]) {
          upgrade["unique-class"]
            .filter(uc => uc !== "")
            .forEach((uc) => removeUniqueClassName(uc));
        }
      });
    });
    
    selectedSquadrons.forEach((squadron) => {
      if (squadron.unique) {
        removeUniqueClassName(squadron.name);
      }
      if (squadron["unique-class"]) {
        squadron["unique-class"]
          .filter(uc => uc !== "")
          .forEach((uc) => removeUniqueClassName(uc));
      }
    });

    // Clear all state synchronously
    setSelectedShips([]);
    setSelectedSquadrons([]);
    setSelectedAssaultObjectives([]);
    setSelectedDefenseObjectives([]);
    setSelectedNavigationObjectives([]);
    setSelectedCampaignObjectives([]);
    setDisabledUpgrades({});
    setEnabledUpgrades({});
    setFilledSlots({});
    setGreyUpgrades({});
    setPoints(0);
    setTotalShipPoints(0);
    setTotalSquadronPoints(0);
    
    // Reset ID counters to avoid conflicts
    setShipIdCounter(0);

    let processingSquadrons = false;
    const shipsToAdd: Ship[] = [];
    const upgradesToAdd: { shipId: string; upgrade: Upgrade }[] = [];
    const squadronsToAdd: Squadron[] = [];
    const squadronLeadersToAdd: { squadronId: string; upgrade: Upgrade }[] = [];
    let currentShipId: string | null = null;
    let lastAddedSquadronId: string | null = null;
    let globalSkirmishCount = 0; // Track skirmish objectives across all lines

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
          if (shipName.includes("[LegacyBeta]")) {
            source = "legacyBeta";
          } else if (shipName.includes("[Legacy]")) {
            source = "legacy";
          } else if (shipName.includes("[Legends]")) {
            source = "legends";
          } else if (shipName.includes("[ARC]")) {
            source = "arc";
          } else if (shipName.includes("[Nexus]")) {
            source = "nexus";
          } else if (shipName.includes("[Naboo]")) {
            source = "naboo";
          }

          const newShip: Ship = {
            ...shipModel,
            id: generateUniqueShipId(),
            assignedUpgrades: [],
            availableUpgrades: shipModel.upgrades || [],
            size: (shipModel.size || "small") as "small" | "medium" | "large" | "huge" | "280-huge",
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
            if (shipName.includes("[LegacyBeta]")) {
              source = "legacyBeta";
            } else if (shipName.includes("[Legacy]")) {
              source = "legacy";
            } else if (shipName.includes("[Legends]")) {
              source = "legends";
            } else if (shipName.includes("[ARC]")) {
              source = "arc";
            } else if (shipName.includes("[Nexus]")) {
              source = "nexus";
            } else if (shipName.includes("[Naboo]")) {
              source = "naboo";
            }
            const selectedSquadron = {
              ...squadron,
              source,
              points: parseInt(shipPoints) // Add this line to ensure points are set correctly
            };
            handleAddingSquadron(selectedSquadron);

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
      } else if (line.startsWith("Gamemode:")) {
        const gamemodeMatch = line.match(/Gamemode:\s*(.+)/);
        if (gamemodeMatch) {
          const newGamemode = gamemodeMatch[1].trim();
          console.log("Found gamemode in import:", newGamemode);
          // Set the gamemode in localStorage which will be picked up by the faction page
          localStorage.setItem('selectedGamemode', newGamemode);
          
          // Check if this gamemode requires content changes and wait for them to load
          const restrictions = getRestrictionsForGamemode(newGamemode as Gamemode);
          if (restrictions?.forceToggles) {
            console.log("Gamemode requires content changes, applying toggles and reloading content...");
            
            // Apply forced toggle settings immediately
            if (restrictions.forceToggles.enableLegacy !== undefined) {
              Cookies.set('enableLegacy', restrictions.forceToggles.enableLegacy.toString(), { expires: 365 });
            }
            if (restrictions.forceToggles.enableLegends !== undefined) {
              Cookies.set('enableLegends', restrictions.forceToggles.enableLegends.toString(), { expires: 365 });
            }
            if (restrictions.forceToggles.enableLegacyBeta !== undefined) {
              Cookies.set('enableLegacyBeta', restrictions.forceToggles.enableLegacyBeta.toString(), { expires: 365 });
            }
            if (restrictions.forceToggles.enableArc !== undefined) {
              Cookies.set('enableArc', restrictions.forceToggles.enableArc.toString(), { expires: 365 });
            }
            if (restrictions.forceToggles.enableArcBeta !== undefined) {
              Cookies.set('enableArcBeta', restrictions.forceToggles.enableArcBeta.toString(), { expires: 365 });
            }
            if (restrictions.forceToggles.enableNexus !== undefined) {
              Cookies.set('enableNexus', restrictions.forceToggles.enableNexus.toString(), { expires: 365 });
            }
            if (restrictions.forceToggles.enableProxy !== undefined) {
              Cookies.set('enableProxy', restrictions.forceToggles.enableProxy.toString(), { expires: 365 });
            }
            if (restrictions.forceToggles.enableNaboo !== undefined) {
              Cookies.set('enableNaboo', restrictions.forceToggles.enableNaboo.toString(), { expires: 365 });
            }
            
            // Force reload content and wait for it to complete
            console.log("Waiting for content to reload...");
            await forceReloadContent(() => {}, () => {}, () => {});
            console.log("Content reload complete, continuing with import...");
            
            // Reload aliases after content reload since they were cleared
            const reloadedAliases = JSON.parse(localStorage.getItem("aliases") || "{}");
            Object.assign(aliases, reloadedAliases);
          }
        }
        continue;
      } else if (line.startsWith("Name:")) {
        const fleetNameMatch = line.match(/Name:\s*(.+)/);
        if (fleetNameMatch) {
          const newFleetName = fleetNameMatch[1].trim();
          setFleetName(newFleetName);
        }
        continue;
      } else if (line.startsWith("Total Points:")) {
        // Skip total points line - will be calculated automatically
        continue;
      } else if (line.startsWith("Squadrons:")) {
        processingSquadrons = true;
        continue;
      } else if (line.startsWith("= ") && processingSquadrons) {
        // Skip squadron points line - will be calculated automatically
        continue;
      } else if (
        (line.startsWith("Assault:") || line.startsWith("Defense:") || line.startsWith("Navigation:") || line.startsWith("Campaign:") || line.startsWith("Skirmish:") ||
         line.startsWith("Skirmish 2:") ||
         line.startsWith("Assault Objective:") || line.startsWith("Defense Objective:") || line.startsWith("Navigation Objective:") || line.startsWith("Campaign Objective:") || line.startsWith("Skirmish Objective:") ||
         line.startsWith("Skirmish 2 Objective:"))
      ) {
        // Handle objectives
        const [type, namesString] = line.split(":");
        const objectiveNames = namesString.split(",").map(name => name.trim()).filter(Boolean);
        
        // If there's no name after the colon, skip this line
        if (objectiveNames.length === 0) {
          console.log(`Skipping empty objective: ${type}`);
          continue;
        }

        for (const objectiveName of objectiveNames) {
          const objectiveKey = getAliasKey(aliases, objectiveName);
          console.log(`Found objective: ${type} - ${objectiveName}`);
          
          if (objectiveKey) {
            const objective = fetchObjective(objectiveKey);
            console.log(`Fetched objective for key: ${objectiveKey}`, objective);
            
            if (objective) {
              console.log(`Setting selected objective: ${type}`);
              switch (type.toLowerCase()) {
                case "assault":
                  if (faction === "sandbox") {
                    setSelectedAssaultObjectives(prev => [...prev, objective]);
                  } else {
                    setSelectedAssaultObjectives([objective]);
                  }
                  break;
                case "defense":
                  if (faction === "sandbox") {
                    setSelectedDefenseObjectives(prev => [...prev, objective]);
                  } else {
                    setSelectedDefenseObjectives([objective]);
                  }
                  break;
                case "navigation":
                  if (faction === "sandbox") {
                    setSelectedNavigationObjectives(prev => [...prev, objective]);
                  } else {
                    setSelectedNavigationObjectives([objective]);
                  }
                  break;
                case "campaign":
                  if (faction === "sandbox") {
                    setSelectedCampaignObjectives(prev => [...prev, objective]);
                  } else {
                    setSelectedCampaignObjectives([objective]);
                  }
                  break;
                case "skirmish":
                  if (faction === "sandbox") {
                    if (globalSkirmishCount === 0) {
                      setSelectedSkirmishObjectives(prev => [...prev, objective]);
                    } else {
                      setSelectedSkirmish2Objectives(prev => [...prev, objective]);
                    }
                  } else {
                    if (globalSkirmishCount === 0) {
                      setSelectedSkirmishObjectives([objective]);
                    } else {
                      setSelectedSkirmish2Objectives([objective]);
                    }
                  }
                  globalSkirmishCount++;
                  break;
                case "skirmish 2":
                  if (faction === "sandbox") {
                    setSelectedSkirmish2Objectives(prev => [...prev, objective]);
                  } else {
                    setSelectedSkirmish2Objectives([objective]);
                  }
                  break;
              }
            } else {
              console.log(`Objective not found: ${objectiveName}`);
              skippedItems.push(objectiveName);
            }
          } else {
            console.log(`Objective key not found in aliases: ${objectiveName}`);
            skippedItems.push(objectiveName);
          }
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
                  case 'legacybeta':
                    source = 'legacyBeta';
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
                  case 'nexus':
                    source = 'nexus';
                    break;
                  case 'naboo':
                    source = 'naboo';
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
        // Check for leader upgrades FIRST (bullet items ending with - Leader)
        const leaderMatch = line.match(/^•\s*(.+?)\s*-\s*Leader\s*\((\d+)\)/);
        if (leaderMatch && lastAddedSquadronId) {
          const [, leaderName, leaderPoints] = leaderMatch;
          const leaderKey = getAliasKey(aliases, `${leaderName} (${leaderPoints})`);
          
          console.log(`Found leader upgrade: ${leaderName} (${leaderPoints}) for squadron ${lastAddedSquadronId}`);
          
          if (leaderKey) {
            const leaderUpgrade = fetchUpgrade(leaderKey);
            if (leaderUpgrade && leaderUpgrade.type === "leader") {
              // Extract source from leader name
              let source: ContentSource = "regular";
              const sourceMatch = leaderName.match(/\[(.*?)\]/);
              if (sourceMatch) {
                const sourceTag = sourceMatch[1].toLowerCase();
                switch (sourceTag) {
                  case 'legacybeta':
                    source = 'legacyBeta';
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
                  case 'nexus':
                    source = 'nexus';
                    break;
                  case 'naboo':
                    source = 'naboo';
                    break;
                }
              }

              squadronLeadersToAdd.push({
                squadronId: lastAddedSquadronId,
                upgrade: { ...leaderUpgrade, source }
              });
              
              console.log(`Added leader ${leaderName} to squadron ${lastAddedSquadronId}`);
            } else {
              console.log(`Leader upgrade not found or not a leader type: ${leaderName}`);
              skippedItems.push(`${leaderName} - Leader`);
            }
          } else {
            console.log(`Leader key not found in aliases: ${leaderName} (${leaderPoints})`);
            skippedItems.push(`${leaderName} - Leader`);
          }
        } else {
          // Handle squadrons
          const squadronMatch = line.match(
            /^•?\s*(?:(\d+)\s*x\s*)?(.+?)\s*\((\d+)\)/
          );
          if (squadronMatch) {
            const [, countStr, squadronName, totalPoints] = squadronMatch;
            const count = countStr ? parseInt(countStr) : 1;
            const pointsPerSquadron = Math.round(parseInt(totalPoints) / count);
            
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
                if (squadronName.includes("[LegacyBeta]")) {
                  source = "legacyBeta";
                } else if (squadronName.includes("[ARCBeta]")) {
                  source = "arcBeta";
                } else if (squadronName.includes("[Legacy]")) {
                  source = "legacy";
                } else if (squadronName.includes("[Legends]")) {
                  source = "legends";
                } else if (squadronName.includes("[ARC]")) {
                  source = "arc";
                          } else if (squadronName.includes("[Nexus]")) {
            source = "nexus";
          } else if (squadronName.includes("[Naboo]")) {
            source = "naboo";
          }
                
                // For Fighter Group mode, handle squadrons individually to support leaders
                const selectedSquadron = {
                  ...squadron,
                  id: generateUniqueSquadronId(),
                  source,
                  count: count,
                  assignedUpgrades: [], // Initialize empty upgrades array for leaders
                  keywords: extractKeywordsFromAbilities(squadron.abilities), // Ensure keywords are populated
                };
                
                squadronsToAdd.push(selectedSquadron);
                lastAddedSquadronId = selectedSquadron.id;
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
    }

    // Build ships with their final availableUpgrades calculated correctly
    const shipsWithUpgrades = shipsToAdd.map(ship => {
      // Get all upgrades for this ship
      const shipUpgrades = upgradesToAdd.filter(({ shipId }) => shipId === ship.id);
      
      console.log(`*** IMPORT DEBUG - Ship ${ship.name}:`);
      console.log(`  Base upgrades:`, ship.upgrades || []);
      console.log(`  Assigned upgrades:`, shipUpgrades.map(({ upgrade }) => upgrade.name));
      
      // Start with base upgrades
      const baseUpgrades = [...(ship.upgrades || [])];
      const finalAvailableUpgrades = [...baseUpgrades];
      
      console.log(`  Starting availableUpgrades:`, finalAvailableUpgrades);
      
      // Add enabled upgrade slots from equipped upgrades
      shipUpgrades.forEach(({ upgrade }) => {
        if (upgrade.restrictions?.enable_upgrades) {
          console.log(`  ${upgrade.name} enables:`, upgrade.restrictions.enable_upgrades);
          upgrade.restrictions.enable_upgrades
            .filter(enabledUpgrade => enabledUpgrade.trim() !== "")
            .forEach(enabledUpgrade => {
              console.log(`    Checking if should add ${enabledUpgrade} (currently has: ${finalAvailableUpgrades.includes(enabledUpgrade)})`);
              // Only add if not already present
              if (!finalAvailableUpgrades.includes(enabledUpgrade)) {
                finalAvailableUpgrades.push(enabledUpgrade);
                console.log(`    Added ${enabledUpgrade}`);
              } else {
                console.log(`    Skipped ${enabledUpgrade} (already present)`);
              }
            });
        }
      });
      
      console.log(`  Final availableUpgrades:`, finalAvailableUpgrades);
      
      // Return ship with properly assigned upgrades and corrected availableUpgrades
      return {
        ...ship,
        availableUpgrades: finalAvailableUpgrades,
        assignedUpgrades: shipUpgrades.map(({ upgrade }) => upgrade)
      };
    });

    // Build squadrons with their leader upgrades
    const squadronsWithLeaders = squadronsToAdd.map(squadron => {
      // Get all leader upgrades for this squadron
      const squadronLeaders = squadronLeadersToAdd.filter(({ squadronId }) => squadronId === squadron.id);
      
      console.log(`*** IMPORT DEBUG - Squadron ${squadron.name}:`);
      console.log(`  Assigned leaders:`, squadronLeaders.map(({ upgrade }) => upgrade.name));
      
      // Return squadron with assigned leader upgrades
      return {
        ...squadron,
        assignedUpgrades: squadronLeaders.map(({ upgrade }) => upgrade),
        keywords: extractKeywordsFromAbilities(squadron.abilities), // Ensure keywords are populated
      };
    });
    
    // Set all fleet data synchronously
    setSelectedShips(shipsWithUpgrades);
    setSelectedSquadrons(squadronsWithLeaders);
    
    // Clear import flag and run final recalculation immediately
    setIsImporting(false);
    
    // Force a recalculation of disabled upgrades with the new fleet data
    // Use requestAnimationFrame to ensure state has been set
    requestAnimationFrame(() => {
      recalculateDisabledUpgradesForShips(shipsWithUpgrades);
    });

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
    preprocessFleetText,
    faction,
    handleAddingSquadron,
    handleIncrementSquadron,
    router,
    setFleetName,
    setNotificationMessage,
    setPoints,
    setSelectedAssaultObjectives,
    setSelectedDefenseObjectives,
    setSelectedNavigationObjectives,
    setSelectedCampaignObjectives,
    setSelectedShips,
    setShowNotification,
    setTotalShipPoints,
    setTotalSquadronPoints,
    recalculateDisabledUpgradesForShips,
    applyUpdates,
    generateUniqueShipId,
    removeUniqueClassName,
    selectedShips,
    selectedSquadrons,
    generateUniqueSquadronId
  ]);

  const handlePrint = () => {
    setShowPrintMenu(true);
  };

  const handleShareButtonClick = useCallback(() => {
    if (!fleetName.trim()) {
      setNotificationMessage('Please enter a fleet name before sharing');
      setShowNotification(true);
      return;
    }

    // Check if fleet name is "Untitled Fleet" and prompt for rename
    if (fleetName === 'Untitled Fleet') {
      setShowShareNamePrompt(true);
      return;
    }

    if (selectedShips.length === 0 && selectedSquadrons.length === 0) {
      setNotificationMessage('Please add ships or squadrons before sharing');
      setShowNotification(true);
      return;
    }

    performShare(fleetName);
  }, [fleetName, selectedShips, selectedSquadrons]);

  const performShare = useCallback(async (nameToUse: string) => {
    try {
      const fleetData = generateExportText();
      const commander = selectedShips.find(ship => 
        ship.assignedUpgrades.some(upgrade => upgrade.type === "commander"))?.assignedUpgrades
          .find(upgrade => upgrade.type === "commander")?.name || "";

      const contentTypes = getContentTypes(fleetData);

      let numericalId: string;

      if (user) {
        // Logged in user - check for existing fleet and update/insert as before
        const { data: existingFleet } = await supabase
          .from('fleets')
          .select('id, numerical_id, shared')
          .eq('user_id', user.sub)
          .eq('fleet_name', nameToUse)
          .single();

        if (existingFleet) {
          // Update existing fleet and enable sharing
          const { error } = await supabase
            .from('fleets')
            .update({ 
              fleet_data: fleetData,
              faction,
              commander,
              points,
              shared: true,
              legends: contentTypes.legends,
              legacy: contentTypes.legacy,
              legacy_beta: contentTypes.legacy_beta,
              arc: contentTypes.arc,
              arc_beta: contentTypes.arc_beta,
              nexus: contentTypes.nexus
            })
            .eq('id', existingFleet.id);

          if (error) throw error;
          
          numericalId = existingFleet.numerical_id;
        } else {
          // Create new fleet with sharing enabled for logged in user
          const { data: newFleet, error } = await supabase
            .from('fleets')
            .insert({ 
              user_id: user.sub,
              fleet_name: nameToUse,
              fleet_data: fleetData,
              faction,
              commander,
              points,
              shared: true,
              legends: contentTypes.legends,
              legacy: contentTypes.legacy,
              legacy_beta: contentTypes.legacy_beta,
              arc: contentTypes.arc,
              arc_beta: contentTypes.arc_beta,
              nexus: contentTypes.nexus
            })
            .select('id, numerical_id')
            .single();

          if (error) throw error;
          
          numericalId = newFleet.numerical_id;
        }
      } else {
        // Anonymous user - create new anonymous fleet
        const { data: newFleet, error } = await supabase
          .from('fleets')
          .insert({ 
            user_id: null,
            fleet_name: nameToUse,
            fleet_data: fleetData,
            faction,
            commander,
            points,
            shared: true,
            legends: contentTypes.legends,
            legacy: contentTypes.legacy,
            legacy_beta: contentTypes.legacy_beta,
            arc: contentTypes.arc,
            arc_beta: contentTypes.arc_beta,
            nexus: contentTypes.nexus
          })
          .select('id, numerical_id')
          .single();

        if (error) throw error;
        
        numericalId = newFleet.numerical_id;
      }

      // Copy share link to clipboard
      const domain = process.env.NEXT_PUBLIC_DOMAIN || window.location.origin;
      const shareUrl = `${domain}/share/${numericalId}`;
      
      await navigator.clipboard.writeText(shareUrl);
      
      if (user) {
        setNotificationMessage(`Fleet shared! Link copied to clipboard:\n${shareUrl}`);
      } else {
        setNotificationMessage(`Fleet shared anonymously! Link copied to clipboard:\n${shareUrl}\n\nNote: You won't be able to edit this fleet later unless you create an account.`);
      }
      setShowNotification(true);

    } catch (error) {
      console.error('Error sharing fleet:', error);
      setNotificationMessage('Failed to share fleet. Please try again.');
      setShowNotification(true);
    }
  }, [user, generateExportText, faction, points]);

  const handleShareNameConfirm = useCallback((newName: string) => {
    setFleetName(newName);
    setShowShareNamePrompt(false);
    performShare(newName);
  }, [setFleetName, performShare]);

  const handleShareNameCancel = useCallback(() => {
    setShowShareNamePrompt(false);
  }, []);

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
          display: grid;
          grid-template-columns: repeat(${selectedCampaignObjectives.length > 0 ? '4' : '3'}, 1fr);
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
            <p>${selectedAssaultObjectives.length > 0 ? selectedAssaultObjectives.map(obj => obj.name).join(", ") : "None"}</p>
          </div>
          <div class="objective-card">
            <h4>Defense</h4>
            <p>${selectedDefenseObjectives.length > 0 ? selectedDefenseObjectives.map(obj => obj.name).join(", ") : "None"}</p>
          </div>
          <div class="objective-card">
            <h4>Navigation</h4>
            <p>${selectedNavigationObjectives.length > 0 ? selectedNavigationObjectives.map(obj => obj.name).join(", ") : "None"}</p>
          </div>
          ${selectedCampaignObjectives.length > 0 ? `
          <div class="objective-card">
            <h4>Campaign</h4>
            <p>${selectedCampaignObjectives.map(obj => obj.name).join(", ")}</p>
          </div>
          ` : ''}
        </div>
      ` : ''}

      ${showPrintRestrictions ? `
        <div class="tournament-info">
          <h3>Restrictions:</h3>
          ${fleetViolations.length === 0
            ? "<p>This list complies with restrictions.</p>"
            : `
              <p>This list does not comply with restrictions:</p>
              <ul>
                ${fleetViolations.map((violation) => `<li>${violation}</li>`).join("")}
              </ul>
            `}
        </div>
      ` : ''}
    </body>
    </html>`;

    return content;
  };

  // Add this before generatePrintnPlayContent
  const generateDamageDeckContent = () => {
    if (!showDamageDeck) return '';
    
    const damageDeckCards = DAMAGE_DECK.flatMap(card => 
      Array(card.count).fill({
        name: card.name,
        cardimage: `https://api.swarmada.wiki/images/${card.name.toLowerCase().replace(/ /g, '-')}.webp`
      })
    );

    const damagePagesNeeded = Math.ceil(damageDeckCards.length / 9);

    return Array.from({ length: damagePagesNeeded }).map((_, pageIndex) => {
      const startIndex = pageIndex * 9;
      const pageCards = damageDeckCards.slice(startIndex, startIndex + 9);

      return pageCards.length > 0 ? `
        <!-- Damage Cards Front -->
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
            ${Array.from({ length: 9 - pageCards.length }).map(() => `
              <div class="poker-card">
                <div class="card-container"></div>
              </div>
            `).join('')}
          </div>
        </div>
        
        ${showCardBacks ? `
          <!-- Damage Cards Back -->
          <div class="page">
            <div class="grid poker-grid">
              ${Array.from({ length: 9 }).map((_, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                const reversedCol = 2 - col;
                const reversedIndex = (row * 3) + reversedCol;
                const reversedCard = reversedIndex < pageCards.length ? pageCards[reversedIndex] : null;
                
                if (!reversedCard) {
                  return `
                    <div class="poker-card">
                      <div class="card-container"></div>
                    </div>
                  `;
                }
                
                return `
                  <div class="poker-card" style="transform: scaleX(-1)">
                    <div class="card-container">
                      <img class="card-image" 
                          src="https://api.swarmada.wiki/images/damage-rear.webp" 
                          alt="Damage card back" />
                          style="${expandCardBacks ? 'transform: scale(1.075);' : ''}" />
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      ` : '';
    }).join('');
  };

  const isHugeShip = (ship: Ship) => ship.size === 'huge' || ship.size === '280-huge';

  // Add this helper function near the top of the file
  const chunkShipsForLayout = (ships: Ship[]) => {
    const chunks: Ship[][] = [];
    let currentChunk: Ship[] = [];

    ships.forEach(ship => {
      if (isHugeShip(ship)) {
        // If we have normal ships pending, add them as a chunk
        if (currentChunk.length > 0) {
          chunks.push([...currentChunk]);
          currentChunk = [];
        }
        // Add huge ship as its own chunk
        chunks.push([ship]);
      } else {
        currentChunk.push(ship);
        // If we have 4 normal ships, create a chunk
        if (currentChunk.length === 4) {
          chunks.push([...currentChunk]);
          currentChunk = [];
        }
      }
    });

    // Add any remaining ships
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  };

  const generatePrintnPlayContent = () => {
    // Calculate number of pages needed for poker cards
    const allCards = [
      ...selectedSquadrons,
      ...selectedShips.flatMap(ship => ship.assignedUpgrades),
      ...[...selectedAssaultObjectives, ...selectedDefenseObjectives, ...selectedNavigationObjectives].filter((obj): obj is Objective => obj !== null)
    ];
    
    const pokerPagesNeeded = Math.ceil(allCards.length / 9); // 9 cards per page
  
    // Define base token sizes in millimeters (actual physical sizes)
    const baseTokenSizes = {
      small: { width: '38.75mm', height: '70.45mm' },
      medium: { width: '58.5mm', height: '101.5mm' },
      large: { width: '73.0mm', height: '128.5mm' },
      huge: { width: '73mm', height: '355mm' },
      '280-huge': { width: '73mm', height: '280mm' }
    };

    // Helper function to calculate optimal layout
    const calculateOptimalLayout = (ships: Ship[]) => {
      // Separate huge ships and regular ships
      const hugeShips = ships.filter(ship => isHugeShip(ship));
      const regularShips = ships.filter(ship => !isHugeShip(ship));

      // Create individual pages for huge ships
      const hugePages = hugeShips.map(ship => ({
        rows: [{
          ships: [ship],
          height: baseTokenSizes[ship.size as keyof typeof baseTokenSizes].height
        }]
      }));

      // Process regular ships with existing logic
      const regularPages = processRegularShips(regularShips);

      // Combine huge ship pages with regular ship pages
      return [...hugePages, ...regularPages];
    };

    // Helper function to process regular ships using existing logic
    const processRegularShips = (ships: Ship[]) => {
      const margin = 0.5; // inches
      const pageWidth = paperSize === 'letter' ? 8.5 : 210/25.4; // convert mm to inches for A4
      const pageHeight = paperSize === 'letter' ? 11 : 297/25.4;
      const usableWidth = pageWidth - (2 * margin);
      const usableHeight = pageHeight - (2 * margin);
      
      // Convert mm to inches with proper sizes
      const tokenSizes = {
        small: { width: 38.75/25.4, height: 70.45/25.4 },
        medium: { width: 58.5/25.4, height: 101.5/25.4 },
        large: { width: 73.0/25.4, height: 128.5/25.4 },
        huge: { width: 73/25.4, height: 355/25.4 },
        '280-huge': { width: 73/25.4, height: 280/25.4 }
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
  
    const baseTokensHTML = selectedShips
      .filter(ship => !ship.name.includes('Dummy'))  // Filter out dummy ships
      .length > 0 
      ? calculateOptimalLayout(selectedShips.filter(ship => !ship.name.includes('Dummy')))
        .map(page => `
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
                    
                    // Handle huge and 280-huge ships differently
                    if (ship.size === 'huge' || ship.size === '280-huge') {
                      const baseHeight = ship.size === 'huge' ? '355mm' : '280mm';
                      const halfHeight = Math.floor(parseInt(baseHeight) / 2) + 'mm';
                      return `
                        <div style="display: flex; flex-direction: row; gap: 4mm;">
                          <!-- Top half -->
                          <div class="base-token" style="
                            width: 73mm;
                            height: ${halfHeight};
                            overflow: hidden;
                            position: relative;
                          ">
                            <img 
                              src="${baseTokenUrl}" 
                              alt="${ship.name} Base Token Top" 
                              style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 73mm;
                                height: ${baseHeight};
                                object-fit: cover;
                                object-position: top;
                              "
                            />
                          </div>
                          <!-- Bottom half -->
                          <div class="base-token" style="
                            width: 73mm;
                            height: ${halfHeight};
                            overflow: hidden;
                            position: relative;
                          ">
                            <img 
                              src="${baseTokenUrl}" 
                              alt="${ship.name} Base Token Bottom" 
                              style="
                                position: absolute;
                                bottom: 0;
                                left: 0;
                                width: 73mm;
                                height: ${baseHeight};
                                object-fit: cover;
                                object-position: bottom;
                              "
                            />
                          </div>
                        </div>
                      `;
                    }
                    
                    // Regular base token rendering for other ships
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
        `).join('') 
      : '';
  
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

            .card-back {
              transform: scaleX(-1);
            }

            .card-back-expanded {
              transform: scaleX(-1) scale(1.075);
              transform-origin: center;
            }

          </style>
      </head>
      <body>
        ${selectedShips.filter(ship => !ship.name.includes('Dummy')).length > 0 ? `
          ${chunkShipsForLayout(selectedShips.filter(ship => !ship.name.includes('Dummy')))
            .map(shipGroup => `
              <!-- Ship Cards Front -->
              <div class="page">
                <div class="grid tarot-grid">
                  ${shipGroup.length === 1 && isHugeShip(shipGroup[0]) 
                    ? `
                      <div class="tarot-card" style="
                        width: 5in;
                        height: 4in;
                        grid-column: 1 / span 2;
                        justify-self: center;
                      ">
                        <div class="card-container">
                          <img class="card-background" src="${shipGroup[0].cardimage}" alt="" />
                          <img class="card-image" src="${shipGroup[0].cardimage}" alt="${shipGroup[0].name}" />
                        </div>
                      </div>
                    `
                    : shipGroup.map(ship => `
                      <div class="tarot-card" style="width: 2.75in; height: 4.75in;">
                        <div class="card-container">
                          <img class="card-background" src="${ship.cardimage}" alt="" />
                          <img class="card-image" src="${ship.cardimage}" alt="${ship.name}" />
                        </div>
                      </div>
                    `).join('')
                  }
                  ${shipGroup.length < 4 && !isHugeShip(shipGroup[0]) 
                    ? Array.from({ length: 4 - shipGroup.length }).map(() => `
                      <div class="tarot-card">
                        <div class="card-container"></div>
                      </div>
                    `).join('')
                    : ''
                  }
                </div>
              </div>
              
              ${showCardBacks ? `
                <!-- Ship Cards Back -->
                <div class="page">
                  <div class="grid tarot-grid">
                    ${shipGroup.length === 1 && isHugeShip(shipGroup[0])
                      ? `
                        <div class="tarot-card" style="
                          transform: scaleX(-1);
                          width: 5in;
                          height: 4in;
                          grid-column: 1 / span 2;
                          justify-self: center;
                        ">
                          <div class="card-container">
                            <img class="card-image" 
                                src="https://api.swarmada.wiki/images/${shipGroup[0].faction}-ship-huge-rear.webp" 
                                alt="${shipGroup[0].name} back" />
                          </div>
                        </div>
                      `
                      : Array.from({ length: 4 }).map((_, index) => {
                        const row = Math.floor(index / 2);
                        const col = index % 2;
                        const reversedCol = 1 - col;
                        const reversedIndex = (row * 2) + reversedCol;
                        const reversedShip = reversedIndex < shipGroup.length ? shipGroup[reversedIndex] : null;
                        
                        if (!reversedShip) {
                          return `
                            <div class="tarot-card">
                              <div class="card-container"></div>
                            </div>
                          `;
                        }
                        
                        return `
                          <div class="tarot-card" style="transform: scaleX(-1)">
                            <div class="card-container">
                              <img class="card-image" 
                                  src="https://api.swarmada.wiki/images/${reversedShip.faction}-ship-rear.webp" 
                                  alt="${reversedShip.name} back" />
                            </div>
                          </div>
                        `;
                      }).join('')
                    }
                  </div>
                </div>
              ` : ''}
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
                ${Array.from({ length: 9 - pageCards.length }).map(() => `
                  <div class="poker-card">
                    <div class="card-container"></div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            ${showCardBacks ? `
              <!-- Poker Cards Back -->
              <div class="page">
                <div class="grid poker-grid">
                  ${Array.from({ length: 9 }).map((_, index) => {
                    const row = Math.floor(index / 3);
                    const col = index % 3;
                    const reversedCol = 2 - col;
                    const reversedIndex = (row * 3) + reversedCol;
                    const reversedCard = reversedIndex < pageCards.length ? pageCards[reversedIndex] : null;
                    
                    if (!reversedCard) {
                      return `
                        <div class="poker-card">
                          <div class="card-container"></div>
                        </div>
                      `;
                    }
                    
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
                      <div class="poker-card" style="transform: scaleX(-1)">
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
            ` : ''}
          ` : '';
        }).join('')}
        ${generateDamageDeckContent()}
        ${baseTokensHTML}
      </body>
      </html>
    `;
  };

  const handlePrintnPlay = useCallback(() => {
    const printContent = generatePrintnPlayContent();
    
    const printWindow = window.open('', 'print_window');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 2500);
    }
    setShowPrintMenu(false);
  }, [generatePrintnPlayContent]);

// ${baseTokensHTML}

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedShips.length > 0 || selectedSquadrons.length > 0) {
        localStorage.setItem(
          "fleetRecovery",
          JSON.stringify({
            ships: selectedShips,
            squadrons: selectedSquadrons,
            objectives: {
              assault: selectedAssaultObjectives,
              defense: selectedDefenseObjectives,
              navigation: selectedNavigationObjectives,
            },
            faction,
            timestamp: new Date().getTime(),
          })
        );
      }
    };

    const checkForRecovery = async () => {
      if (!isExpansionMode && !hasLoadedPage) {
        const retrievedFromList = document.cookie.includes('retrieved-from-list=true');
        const recovery = localStorage.getItem("fleetRecovery");
        const savedFleet = localStorage.getItem(`savedFleet_${faction}`);
        const pendingImport = localStorage.getItem("pendingImport");

        // Check for pending import first (highest priority)
        if (pendingImport && !retrievedFromList) {
          console.log("Processing pending import:", pendingImport);
          await handleImportFleet(pendingImport, 'starforge');
          localStorage.removeItem("pendingImport");
        } else if (retrievedFromList && savedFleet) {
          const updatedFleet = applyUpdates(savedFleet);
          await handleImportFleet(updatedFleet, 'kingston');
          document.cookie = "retrieved-from-list=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        } else if (recovery && !retrievedFromList) {
          const data = JSON.parse(recovery);
          if (
            data.faction === faction &&
            (data.ships.length > 0 || data.squadrons.length > 0) &&
            data.timestamp > new Date().getTime() - 3600000 &&
            selectedShips.length === 0 &&
            selectedSquadrons.length === 0
          ) {
            setShowRecoveryPopup(true);
          }
        }
        setHasLoadedPage(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Call async function from useEffect
    (async () => {
      await checkForRecovery();
    })();

    // Mark page as loaded after initial check
    if (!hasLoadedPage) {
      setHasLoadedPage(true);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    faction,
    selectedShips,
    selectedSquadrons,
    selectedAssaultObjectives,
    selectedDefenseObjectives,
    selectedNavigationObjectives,
    isExpansionMode,
    hasLoadedPage,
    handleImportFleet,
    applyUpdates
  ]);

  useEffect(() => {
    if (selectedShips.length > 0 || selectedSquadrons.length > 0) {
      saveFleetToLocalStorage();
    }
  }, [
    selectedShips,
    selectedSquadrons,
    selectedAssaultObjectives,
    selectedDefenseObjectives,
    selectedNavigationObjectives,
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
      setSelectedAssaultObjectives([]);
      setSelectedDefenseObjectives([]);
      setSelectedNavigationObjectives([]);
      setUniqueClassNames([]);
      console.log("clearing state");
    };
  }, []);

  useEffect(() => {
    if (isExpansionMode && (selectedShips.length > 0 || selectedSquadrons.length > 0)) {
      if (faction === 'sandbox') {
        setShowCardBacks(false);
        setShowDamageDeck(false);
        setShowPrintObjectives(false);
        setShowPrintRestrictions(false);
      }
      // Show print menu instead of directly printing
      setShowPrintMenu(true);
    }
  }, [
    isExpansionMode, 
    selectedShips.length, 
    selectedSquadrons.length, 
    faction,
    setShowCardBacks,
    setShowDamageDeck,
    setShowPrintObjectives,
    setShowPrintRestrictions
  ]);

  // First, create a memoized initialization function
  const initializeUniqueClasses = useCallback(() => {
    // First clear all existing unique class names
    resetUniqueClassNames();

    // Then add all current unique class names
    selectedShips.forEach(ship => {
      if (ship.unique) {
        addUniqueClassName(ship.name);
      }
      ship.assignedUpgrades.forEach(upgrade => {
        if (upgrade.unique) {
          addUniqueClassName(upgrade.name);
        }
        if (upgrade["unique-class"]) {
          upgrade["unique-class"]
            .filter(uc => uc !== "") // Filter out empty strings
            .forEach(uc => addUniqueClassName(uc));
        }
      });
    });
    
    selectedSquadrons.forEach(squadron => {
      if (squadron.unique) {
        addUniqueClassName(squadron.name);
      }
      if (squadron["unique-class"]) {
        squadron["unique-class"]
          .filter(uc => uc !== "")
          .forEach(uc => addUniqueClassName(uc));
      }
    });
  }, [
    selectedShips, 
    selectedSquadrons, 
    addUniqueClassName, 
    resetUniqueClassNames
  ]);

  // Then use it in the effect
  useEffect(() => {
    initializeUniqueClasses();

    // Cleanup function
    return () => {
      resetUniqueClassNames();
    };
  }, [initializeUniqueClasses, resetUniqueClassNames]);

  const handleClearFleet = useCallback(() => {
    // Reset all state when clearing the fleet
    setSelectedShips([]);
    setSelectedSquadrons([]);
    setPoints(0);
    setTotalShipPoints(0);
    setTotalSquadronPoints(0);
    setPreviousPoints(0);
    setPreviousShipPoints(0);
    setPreviousSquadronPoints(0);
    setDisabledUpgrades({});
    setEnabledUpgrades({});
    setFilledSlots({});
    setGreyUpgrades({});
    setSelectedAssaultObjectives([]);
    setSelectedDefenseObjectives([]);
    setSelectedNavigationObjectives([]);
    setUniqueClassNames([]);
    setShipIdCounter(0);
    console.log("clearing fleet state");
  }, []);

  // Memoize content source checking
  const contentSourcesEnabled = useMemo(() => {
    return {
      arc: Cookies.get('enableArc') === 'true',
      legacy: Cookies.get('enableLegacy') === 'true',
      legends: Cookies.get('enableLegends') === 'true',
      legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
      arcBeta: Cookies.get('enableArcBeta') === 'true',
      amg: Cookies.get('enableAMG') === 'true',
      nexus: Cookies.get('enableNexus') === 'true'
    };
  }, []); // Empty dependency array as this should only run once on mount

  // Use a ref to track changes
  const previousContentSources = useRef(contentSourcesEnabled);

  // Check for changes less frequently
  useEffect(() => {
    const checkContentSources = () => {
      const newSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
        arcBeta: Cookies.get('enableArcBeta') === 'true',
        amg: Cookies.get('enableAMG') === 'true',
        nexus: Cookies.get('enableNexus') === 'true'
      };

      if (JSON.stringify(newSources) !== JSON.stringify(previousContentSources.current)) {
        previousContentSources.current = newSources;
        // Update your content
      }
    };

    const interval = setInterval(checkContentSources, 2000); // Check every 2 seconds instead of every second
    return () => clearInterval(interval);
  }, []);

  const restrictions = getRestrictionsForGamemode(gamemode as Gamemode);
  const aceCount = selectedSquadrons.filter((s) => s.ace).length;

  // Effect to set forced objectives when gamemode changes
  useEffect(() => {
    const forcedObjectives = restrictions?.objectiveRestrictions?.forcedObjectives;
    if (forcedObjectives) {
      // Fetch actual objective objects for forced objectives
      const setForcedObjective = (objectiveName: string, setterFunction: (objectives: ObjectiveModel[]) => void) => {
        // Try to find the objective in localStorage using the same logic as fetchObjective
        const aliases = JSON.parse(localStorage.getItem('aliases') || '{}');
        const objectiveKey = getAliasKey(aliases, objectiveName);
        
        if (objectiveKey) {
          const objective = fetchObjective(objectiveKey);
          if (objective) {
            setterFunction([objective]);
          } else {
            console.warn(`Forced objective "${objectiveName}" not found in game data`);
          }
        } else {
          console.warn(`Forced objective "${objectiveName}" not found in aliases`);
        }
      };

      if (forcedObjectives.assault) {
        setForcedObjective(forcedObjectives.assault, setSelectedAssaultObjectives);
      }
      if (forcedObjectives.defense) {
        setForcedObjective(forcedObjectives.defense, setSelectedDefenseObjectives);
      }
      if (forcedObjectives.navigation) {
        setForcedObjective(forcedObjectives.navigation, setSelectedNavigationObjectives);
      }
      if (forcedObjectives.campaign) {
        setForcedObjective(forcedObjectives.campaign, setSelectedCampaignObjectives);
      }
      if (forcedObjectives.skirmish) {
        setForcedObjective(forcedObjectives.skirmish, setSelectedSkirmishObjectives);
      }
      if (forcedObjectives.skirmish2) {
        setForcedObjective(forcedObjectives.skirmish2, setSelectedSkirmish2Objectives);
      }
    }
  }, [gamemode, restrictions]);

  // Get gamemode restrictions
  const gamemodeRestrictions = useMemo(() => {
    return GAMEMODE_RESTRICTIONS[gamemode as keyof typeof GAMEMODE_RESTRICTIONS];
  }, [gamemode]);

  // Check if current faction is allowed in the gamemode
  const isFactionAllowed = useMemo(() => {
    if (!gamemodeRestrictions) return true;
    
    // Check if faction is explicitly disallowed
    if (gamemodeRestrictions.disallowedFactions && gamemodeRestrictions.disallowedFactions.includes(faction)) {
      return false;
    }

    // Check if there's an allowed factions list and faction is not in it
    if (gamemodeRestrictions.allowedFactions && !gamemodeRestrictions.allowedFactions.includes(faction)) {
      return false;
    }

    return true;
  }, [gamemodeRestrictions, faction]);

  return (
    <div ref={contentRef} className="max-w-[2000px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
        {(
          <div className="mb-2 sm:mb-0 flex items-center justify-start space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Print Fleet</p>
                </TooltipContent>
              </Tooltip>

              {user && (
                <Tooltip>
                  <TooltipTrigger asChild>
                                     <Button variant="outline" className="bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md" onClick={handleShareButtonClick}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share Fleet</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
                             <Tooltip>
                 <TooltipTrigger asChild>
                 <Button variant="outline" className="bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md" onClick={() => setShowExportPopup(true)}>
                     <FileText className="h-4 w-4" />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>Export Fleet</p>
                 </TooltipContent>
               </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md" onClick={() => setShowImportWindow(true)}>
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
                    setFleetName={setFleetName}
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
            {fleetViolations.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-yellow-500">
                    <TriangleAlert className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Restrictions Violations:</h4>
                    <ul className="list-disc pl-4 space-y-1">
                      {fleetViolations.map((violation, index) => (
                        <li key={index}>{violation}</li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
        <div className="flex-grow logo-font" />
        {(faction !== "sandbox" || (selectedShips.length > 0 || selectedSquadrons.length > 0)) && (
          <PointsDisplay points={points} previousPoints={previousPoints} />
        )}
      </div>

      {/* Faction restriction warning */}
      {!isFactionAllowed && gamemode && gamemode !== 'standard' && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg text-center font-semibold">
          This faction is not allowed in the current gamemode ({gamemode}). 
          Fleet restrictions may not be properly enforced.
        </div>
      )}

      {faction === "sandbox" && (
        <ExpansionSelector 
          onSelectExpansion={(fleet) => handleImportFleet(fleet, 'kingston')}
          onClearFleet={handleClearFleet}
          hasFleet={selectedShips.length > 0 || selectedSquadrons.length > 0}
          isExpansionMode={isExpansionMode}
          setExpansionMode={setIsExpansionMode}
        />
      )}
      {!isExpansionMode && (
        <>
          {selectedShips.length > 0 ? (
            <>
              <SectionHeader
                title="Ships"
                points={totalShipPoints}
                previousPoints={previousShipPoints}
                show={true}
                onClearAll={handleClearAllShips}
                onAdd={handleAddShip}
                pointsLimit={restrictions?.pointsLimit ?? 0}
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
                      filledSlots={filledSlots[ship.id] || {}}
                      hasCommander={hasCommander}
                      traits={ship.traits || []}
                      onMoveUp={() => handleMoveShip(ship.id, 'up')}
                      onMoveDown={() => handleMoveShip(ship.id, 'down')}
                      isFirst={ship.id === selectedShips[0].id}
                      isLast={ship.id === selectedShips[selectedShips.length - 1].id}
                      greyUpgrades={greyUpgrades[ship.id] || []}
                    />
                  ))}
                </div>

              </div>
            </>
          ) : (
            <Card className="mb-4 relative">
              <Button
                className={`w-full justify-between bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-md text-lg py-6 ${
                  gamemode === "Fighter Group" ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                variant="outline"
                onClick={handleAddShip}
                disabled={gamemode === "Fighter Group"}
              >
                <span className="text-lg">
                  {gamemode === "Fighter Group" ? "SHIPS NOT ALLOWED" : "ADD SHIP"}
                </span>
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
                onClearAll={handleClearAllSquadrons}
                onAdd={handleAddSquadron}
                pointsLimit={restrictions?.squadronPointsLimit ?? 0}
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
                      onMoveUp={() => handleMoveSquadron(squadron.id, 'up')}
                      onMoveDown={() => handleMoveSquadron(squadron.id, 'down')}
                      isFirst={squadron.id === selectedSquadrons[0].id}
                      isLast={squadron.id === selectedSquadrons[selectedSquadrons.length - 1].id}
                      selectedSquadrons={selectedSquadrons}
                      gamemode={gamemode}
                      onUpgradeClick={handleSquadronUpgradeClick}
                      handleRemoveUpgrade={handleRemoveSquadronUpgrade}
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
            {(() => {
              // Check if skirmish objectives are enabled (Fighter Group mode)
              const skirmishEnabled = restrictions?.objectiveRestrictions?.enableSkirmishObjectives === true;
              
              // If skirmish is enabled, only show skirmish objective
              if (skirmishEnabled) {
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xl">
                    <SwipeableObjective
                      type="skirmish"
                      selectedObjective={selectedSkirmishObjectives[0]}
                      selectedObjectives={faction === "sandbox" ? selectedSkirmishObjectives : undefined}
                      onRemove={handleRemoveSkirmishObjective}
                      onOpen={() => setShowSkirmishObjectiveSelector(true)}
                      color="#8B5CF6"
                      gamemodeRestrictions={restrictions}
                    />
                    <SwipeableObjective
                      type="skirmish"
                      selectedObjective={selectedSkirmish2Objectives[0]}
                      selectedObjectives={faction === "sandbox" ? selectedSkirmish2Objectives : undefined}
                      onRemove={handleRemoveSkirmish2Objective}
                      onOpen={() => setShowSkirmish2ObjectiveSelector(true)}
                      color="#8B5CF6"
                      gamemodeRestrictions={restrictions}
                    />
                  </div>
                );
              }
              
              // Check if campaign objectives are enabled
              const campaignEnabled = restrictions?.objectiveRestrictions?.enableCampaignObjectives === true;
              
              const gridCols = campaignEnabled ? "lg:grid-cols-4" : "lg:grid-cols-3";
              
              return (
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-2 text-xl`}>
                  <SwipeableObjective
                    type="assault"
                    selectedObjective={selectedAssaultObjectives[0]}
                    selectedObjectives={faction === "sandbox" ? selectedAssaultObjectives : undefined}
                    onRemove={handleRemoveAssaultObjective}
                    onOpen={() => setShowAssaultObjectiveSelector(true)}
                    color="#EB3F3A"
                    gamemodeRestrictions={restrictions}
                  />
                  <SwipeableObjective
                    type="defense"
                    selectedObjective={selectedDefenseObjectives[0]}
                    selectedObjectives={faction === "sandbox" ? selectedDefenseObjectives : undefined}
                    onRemove={handleRemoveDefenseObjective}
                    onOpen={() => setShowDefenseObjectiveSelector(true)}
                    color="#FAEE13"
                    gamemodeRestrictions={restrictions}
                  />
                  <SwipeableObjective
                    type="navigation"
                    selectedObjective={selectedNavigationObjectives[0]}
                    selectedObjectives={faction === "sandbox" ? selectedNavigationObjectives : undefined}
                    onRemove={handleRemoveNavigationObjective}
                    onOpen={() => setShowNavigationObjectiveSelector(true)}
                    color="#C2E1F4"
                    gamemodeRestrictions={restrictions}
                  />
                  {campaignEnabled && (
                    <SwipeableObjective
                      type="campaign"
                      selectedObjective={selectedCampaignObjectives[0]}
                      selectedObjectives={faction === "sandbox" ? selectedCampaignObjectives : undefined}
                      onRemove={handleRemoveCampaignObjective}
                      onOpen={() => setShowCampaignObjectiveSelector(true)}
                      color="#27AE60"
                      gamemodeRestrictions={restrictions}
                    />
                  )}
                </div>
              );
            })()}
          </div>
        </>
      )}

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
          gamemodeRestrictions={gamemodeRestrictions}
          selectedShips={selectedShips}
        />
      )}

      {showSquadronSelector && (
        <SquadronSelector
          faction={faction}
          filter={squadronFilter}
          onSelectSquadron={handleSelectSquadron}
          onClose={() => setShowSquadronSelector(false)}
          selectedSquadrons={selectedSquadrons}
          aceLimit={gamemodeRestrictions?.aceLimit}
          aceCount={aceCount}
          gamemodeRestrictions={gamemodeRestrictions}
        />
      )}

      {showAssaultObjectiveSelector && (
        <ObjectiveSelector
          type="assault"
          onSelectObjective={handleSelectAssaultObjective}
          onClose={() => setShowAssaultObjectiveSelector(false)}
          gamemodeRestrictions={restrictions}
          forcedObjectiveName={restrictions?.objectiveRestrictions?.forcedObjectives?.assault}
          selectedObjectives={[
            ...selectedAssaultObjectives,
            ...selectedDefenseObjectives,
            ...selectedNavigationObjectives,
            ...selectedCampaignObjectives,
            ...selectedSkirmishObjectives,
            ...selectedSkirmish2Objectives
          ]}
        />
      )}

      {showDefenseObjectiveSelector && (
        <ObjectiveSelector
          type="defense"
          onSelectObjective={handleSelectDefenseObjective}
          onClose={() => setShowDefenseObjectiveSelector(false)}
          gamemodeRestrictions={restrictions}
          forcedObjectiveName={restrictions?.objectiveRestrictions?.forcedObjectives?.defense}
          selectedObjectives={[
            ...selectedAssaultObjectives,
            ...selectedDefenseObjectives,
            ...selectedNavigationObjectives,
            ...selectedCampaignObjectives,
            ...selectedSkirmishObjectives,
            ...selectedSkirmish2Objectives
          ]}
        />
      )}

      {showNavigationObjectiveSelector && (
        <ObjectiveSelector
          type="navigation"
          onSelectObjective={handleSelectNavigationObjective}
          onClose={() => setShowNavigationObjectiveSelector(false)}
          gamemodeRestrictions={restrictions}
          forcedObjectiveName={restrictions?.objectiveRestrictions?.forcedObjectives?.navigation}
          selectedObjectives={[
            ...selectedAssaultObjectives,
            ...selectedDefenseObjectives,
            ...selectedNavigationObjectives,
            ...selectedCampaignObjectives,
            ...selectedSkirmishObjectives,
            ...selectedSkirmish2Objectives
          ]}
        />
      )}

      {showCampaignObjectiveSelector && (
        <ObjectiveSelector
          type="campaign"
          onSelectObjective={handleSelectCampaignObjective}
          onClose={() => setShowCampaignObjectiveSelector(false)}
          gamemodeRestrictions={restrictions}
          forcedObjectiveName={restrictions?.objectiveRestrictions?.forcedObjectives?.campaign}
          selectedObjectives={[
            ...selectedAssaultObjectives,
            ...selectedDefenseObjectives,
            ...selectedNavigationObjectives,
            ...selectedCampaignObjectives,
            ...selectedSkirmishObjectives,
            ...selectedSkirmish2Objectives
          ]}
        />
      )}

      {showSkirmishObjectiveSelector && (
        <ObjectiveSelector
          type="skirmish"
          onSelectObjective={handleSelectSkirmishObjective}
          onClose={() => setShowSkirmishObjectiveSelector(false)}
          gamemodeRestrictions={restrictions}
          forcedObjectiveName={restrictions?.objectiveRestrictions?.forcedObjectives?.skirmish}
          selectedObjectives={[
            ...selectedAssaultObjectives,
            ...selectedDefenseObjectives,
            ...selectedNavigationObjectives,
            ...selectedCampaignObjectives,
            ...selectedSkirmishObjectives,
            ...selectedSkirmish2Objectives
          ]}
        />
      )}

      {showSkirmish2ObjectiveSelector && (
        <ObjectiveSelector
          type="skirmish"
          onSelectObjective={handleSelectSkirmish2Objective}
          onClose={() => setShowSkirmish2ObjectiveSelector(false)}
          gamemodeRestrictions={restrictions}
          forcedObjectiveName={restrictions?.objectiveRestrictions?.forcedObjectives?.skirmish2}
          selectedObjectives={[
            ...selectedAssaultObjectives,
            ...selectedDefenseObjectives,
            ...selectedNavigationObjectives,
            ...selectedCampaignObjectives,
            ...selectedSkirmishObjectives,
            ...selectedSkirmish2Objectives
          ]}
        />
      )}

      {showUpgradeSelector && (
        <UpgradeSelector
          upgradeType={currentUpgradeType}
          faction={faction}
          onSelectUpgrade={handleSelectUpgrade}
          onClose={() => {
            setShowUpgradeSelector(false);
            setCurrentSquadronId("");
          }}
          selectedUpgrades={[
            ...selectedShips.flatMap(ship => ship.assignedUpgrades),
            ...selectedSquadrons.flatMap(squadron => squadron.assignedUpgrades || [])
          ]}
          shipType={currentSquadronId ? 
            selectedSquadrons.find(squadron => squadron.id === currentSquadronId)?.name || "" :
            selectedShips.find(s => s.id === currentShipId)?.chassis || ''
          }
          chassis={currentSquadronId ? "" : selectedShips.find(s => s.id === currentShipId)?.chassis || ''}
          shipSize={currentSquadronId ? "small" : selectedShips.find(s => s.id === currentShipId)?.size || ''}
          shipTraits={currentSquadronId ? [] : selectedShips.find(s => s.id === currentShipId)?.traits || []}
          currentShipUpgrades={currentSquadronId ? 
            selectedSquadrons.find(squadron => squadron.id === currentSquadronId)?.assignedUpgrades || [] :
            selectedShips.find(s => s.id === currentShipId)?.assignedUpgrades || []
          }
          disabledUpgrades={currentSquadronId ? [] : disabledUpgrades[currentShipId] || []}
          ship={currentSquadronId ? {} as Ship : selectedShips.find(s => s.id === currentShipId)!}
          gamemodeRestrictions={gamemodeRestrictions}
          isSquadronUpgrade={!!currentSquadronId}
          squadronKeywords={currentSquadronId ? 
            selectedSquadrons.find(squadron => squadron.id === currentSquadronId)?.keywords || [] :
            []
          }
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
        showDamageDeck={showDamageDeck}
        setShowDamageDeck={setShowDamageDeck}
        showCardBacks={showCardBacks}
        setShowCardBacks={setShowCardBacks}
        expandCardBacks={expandCardBacks}
        setExpandCardBacks={setExpandCardBacks}
      />
    )}

    {showDeleteShipsConfirmation && (
      <NotificationWindow
        title="Delete All Ships"
        message="Are you sure you want to delete all ships?"
        onClose={() => setShowDeleteShipsConfirmation(false)}
        showConfirmButton={true}
        onConfirm={() => {
          clearAllShips();
          setShowDeleteShipsConfirmation(false);
        }}
      />
    )}

    {showDeleteSquadronsConfirmation && (
      <NotificationWindow
        title="Delete All Squadrons"
        message="Are you sure you want to delete all squadrons?"
        onClose={() => setShowDeleteSquadronsConfirmation(false)}
        showConfirmButton={true}
        onConfirm={() => {
          clearAllSquadrons();
          setShowDeleteSquadronsConfirmation(false);
        }}
      />
    )}

    {showShareNamePrompt && (
      <FleetNamePrompt
        currentName={fleetName}
        onConfirm={handleShareNameConfirm}
        onCancel={handleShareNameCancel}
        action="share"
      />
    )}
    </div>
  );
}