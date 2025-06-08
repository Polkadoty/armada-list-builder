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
  release?: string;
  // Ship combat properties matching ShipModel structure
  speed: Record<string, number[]>;
  tokens: Record<string, number>;
  armament: Record<string, number[]>;
  upgrades?: string[];
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
  release?: string;
}

export interface Objective {
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
    grey_upgrades?: string[];
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
  release?: string;
}

export type ContentSource = "regular" | "legacy" | "legends" | "legacyBeta" | "arc" | "community" | "amg" | "nexus";

export type FleetFormat = 'kingston' | 'afd' | 'warlords' | 'starforge';

export interface FleetFilter {
  minPoints: number;
  maxPoints: number;
}

export interface FleetState {
  points: number;
  previousPoints: number;
  totalShipPoints: number;
  totalSquadronPoints: number;
  previousShipPoints: number;
  previousSquadronPoints: number;
  selectedShips: Ship[];
  selectedSquadrons: Squadron[];
  selectedAssaultObjectives: Objective[];
  selectedDefenseObjectives: Objective[];
  selectedNavigationObjectives: Objective[];
  hasCommander: boolean;
}

export interface UpgradeState {
  disabledUpgrades: Record<string, string[]>;
  enabledUpgrades: Record<string, string[]>;
  filledSlots: Record<string, Record<string, number[]>>;
  greyUpgrades: Record<string, string[]>;
}

export interface UIState {
  showShipSelector: boolean;
  showSquadronSelector: boolean;
  showFilter: boolean;
  showAssaultObjectiveSelector: boolean;
  showDefenseObjectiveSelector: boolean;
  showNavigationObjectiveSelector: boolean;
  showUpgradeSelector: boolean;
  showExportPopup: boolean;
  showImportWindow: boolean;
  showNotification: boolean;
  showRecoveryPopup: boolean;
  showPrintMenu: boolean;
  isExpansionMode: boolean;
  showDeleteShipsConfirmation: boolean;
  showDeleteSquadronsConfirmation: boolean;
  currentUpgradeType: string;
  currentShipId: string;
  currentUpgradeIndex: number;
  notificationMessage: string;
  squadronToSwap: string | null;
}

export interface PrintSettings {
  paperSize: 'letter' | 'a4';
  showPrintRestrictions: boolean;
  showPrintObjectives: boolean;
  showCardBacks: boolean;
  showDamageDeck: boolean;
  expandCardBacks: boolean;
}

export const DAMAGE_DECK = [
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