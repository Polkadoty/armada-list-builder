export type Gamemode = "Task Force" | "Standard" | "Sector Fleet" | "Monster Trucks" | "Campaign" | "Fighter Group";

export interface GamemodeRestrictions {
  pointsLimit?: number;
  squadronPointsLimit?: number;
  flotillaLimit?: number;
  aceLimit?: number;
  requireObjectives?: boolean;
  requireCommander?: boolean;
  forceToggles?: Partial<{
    tournamentMode: boolean;
    enableLegacy: boolean;
    enableLegends: boolean;
    enableOldLegacy: boolean;
    enableArc: boolean;
    enableCustomFactions: boolean;
    enableLocalContent: boolean;
    enableProxy: boolean;
  }>;
}

export const GAMEMODE_RESTRICTIONS: Record<Gamemode, GamemodeRestrictions> = {
  "Task Force": {
    pointsLimit: 200,
    squadronPointsLimit: 67,
    flotillaLimit: 1,
    aceLimit: 2,
    requireObjectives: true,
    requireCommander: true,
    forceToggles: { tournamentMode: true },
  },
  "Standard": {
    pointsLimit: 400,
    squadronPointsLimit: 134,
    flotillaLimit: 2,
    aceLimit: 4,
    requireObjectives: true,
    requireCommander: true,
    forceToggles: { tournamentMode: true },
  },
  "Sector Fleet": {
    pointsLimit: 800,
    squadronPointsLimit: 268,
    flotillaLimit: 4,
    aceLimit: 8,
    requireObjectives: true,
    requireCommander: true,
    forceToggles: { tournamentMode: true },
  },
  "Monster Trucks": {
    pointsLimit: 500,
    squadronPointsLimit: 167,
    flotillaLimit: 2,
    aceLimit: 5,
    requireObjectives: false,
    requireCommander: false,
    forceToggles: { tournamentMode: false },
  },
  "Campaign": {
    pointsLimit: 600,
    squadronPointsLimit: 200,
    flotillaLimit: 3,
    aceLimit: 6,
    requireObjectives: false,
    requireCommander: false,
    forceToggles: { tournamentMode: false },
  },
  "Fighter Group": {
    pointsLimit: 134,
    squadronPointsLimit: 134,
    flotillaLimit: 0,
    aceLimit: 4,
    requireObjectives: false,
    requireCommander: false,
    forceToggles: { tournamentMode: false },
  },
};

export function getRestrictionsForGamemode(gamemode: Gamemode): GamemodeRestrictions {
  return GAMEMODE_RESTRICTIONS[gamemode];
}

export interface FleetState {
  points: number;
  totalSquadronPoints: number;
  selectedShips: { traits?: string[] }[];
  selectedSquadrons: { ace?: boolean }[];
  selectedAssaultObjectives?: unknown[];
  selectedDefenseObjectives?: unknown[];
  selectedNavigationObjectives?: unknown[];
  commanderCount: number;
}

export function checkFleetViolations(gamemode: Gamemode, fleet: FleetState): string[] {
  const restrictions = getRestrictionsForGamemode(gamemode);
  const violations: string[] = [];

  if (restrictions.pointsLimit !== undefined && fleet.points > restrictions.pointsLimit) {
    violations.push(`Fleet exceeds ${restrictions.pointsLimit} point limit`);
  }

  if (restrictions.squadronPointsLimit !== undefined && fleet.totalSquadronPoints > restrictions.squadronPointsLimit) {
    violations.push(`Squadrons exceed ${restrictions.squadronPointsLimit} point limit`);
  }

  if (restrictions.flotillaLimit !== undefined) {
    const flotillaCount = fleet.selectedShips.filter((ship) => ship.traits?.includes("flotilla")).length;
    if (flotillaCount > restrictions.flotillaLimit) {
      violations.push(`More than ${restrictions.flotillaLimit} flotillas in fleet`);
    }
  }

  if (restrictions.aceLimit !== undefined) {
    const aceSquadronCount = fleet.selectedSquadrons.filter((squadron) => squadron.ace === true).length;
    if (aceSquadronCount > restrictions.aceLimit) {
      violations.push(`More than ${restrictions.aceLimit} aces in fleet`);
    }
  }

  if (restrictions.requireObjectives) {
    if (!fleet.selectedAssaultObjectives || !fleet.selectedDefenseObjectives || !fleet.selectedNavigationObjectives) {
      violations.push("Missing objective card(s)");
    }
  }

  if (restrictions.requireCommander) {
    if (fleet.commanderCount !== 1) {
      violations.push("One commander upgrade is required");
    }
  }

  return violations;
} 