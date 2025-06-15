export type Gamemode = "Task Force" | "Standard" | "Sector Fleet" | "Battle for Naboo - Week 1" | "Unrestricted";
// "Minivan" | "Campaign" | "Fighter Group"

export interface GamemodeRestrictions {
  pointsLimit?: number;
  squadronPointsLimit?: number;
  flotillaLimit?: number;
  aceLimit?: number;
  requireObjectives?: boolean;
  requireCommander?: boolean;
  allowedShipClasses?: string[];
  disallowedShipClasses?: string[];
  allowedShipSizes?: ("small" | "medium" | "large" | "huge" | "280-huge")[];
  disallowedShipSizes?: ("small" | "medium" | "large" | "huge" | "280-huge")[];
  allowedSquadronKeywords?: string[];
  disallowedSquadronKeywords?: string[];
  allowedCommanders?: string[];
  disallowedCommanders?: string[];
  allowedSquadronUniqueClasses?: string[];
  disallowedSquadronUniqueClasses?: string[];
  allowedUpgradeUniqueClasses?: string[];
  disallowedUpgradeUniqueClasses?: string[];
  objectiveRestrictions?: {
    disableSelection?: boolean; // Completely disable objective selection
    hideDetails?: boolean; // Show generic "Chosen Objective" instead of actual cards
    enableCampaignObjectives?: boolean; // Enable the campaign objective slot
    forcedObjectives?: {
      assault?: string;
      defense?: string;
      navigation?: string;
      campaign?: string;
    };
    allowedObjectives?: {
      assault?: string[];
      defense?: string[];
      navigation?: string[];
      campaign?: string[];
    };
    disallowedObjectives?: {
      assault?: string[];
      defense?: string[];
      navigation?: string[];
      campaign?: string[];
    };
  };
  forceToggles?: Partial<{
    tournamentMode: boolean;
    enableLegacy: boolean;
    enableLegends: boolean;
    enableLegacyBeta: boolean;
    enableArc: boolean;
    enableNexus: boolean;
    enableCustomFactions: boolean;
    enableLocalContent: boolean;
    enableProxy: boolean;
  }>;
  allowedFactions?: string[];
  disallowedFactions?: string[];
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
  // "Minivan": {
  //   pointsLimit: 200,
  //   squadronPointsLimit: 80,
  //   flotillaLimit: 2,
  //   aceLimit: 1,
  //   requireObjectives: true,
  //   requireCommander: true
  // },
  // "Campaign": {
  //   pointsLimit: 600,
  //   squadronPointsLimit: 200,
  //   flotillaLimit: 3,
  //   aceLimit: 6,
  //   requireObjectives: false,
  //   requireCommander: false,
  //   forceToggles: { tournamentMode: false },
  // },
  // "Fighter Group": {
  //   pointsLimit: 134,
  //   squadronPointsLimit: 134,
  //   flotillaLimit: 0,
  //   aceLimit: 4,
  //   requireObjectives: false,
  //   requireCommander: false,
  //   forceToggles: { tournamentMode: false },
  // },
  "Battle for Naboo - Week 1": {
    pointsLimit: 250,
    squadronPointsLimit: 90,
    flotillaLimit: 1,
    aceLimit: 2,
    requireObjectives: false,
    requireCommander: true,
    allowedShipSizes: ["small", "medium"],
    disallowedShipSizes: ["large"],
    disallowedSquadronKeywords: ["adept"],
    allowedCommanders: ["Ki-Adi-Mundi", "Daultay Dofine"],
    disallowedSquadronUniqueClasses: ["Anakin Skywalker", "Ahsoka Tano", "Kit Fisto", "Luminara Unduli", "Plo Koon", "General Grievous", "Wat Tambor", "Count Dooku", "Jango Fett", "Darth Maul"],
    objectiveRestrictions: {
      disableSelection: true,
      hideDetails: true,
      enableCampaignObjectives: true,
      allowedObjectives: {
        assault: ["Surprise Attack"],
      },
      forcedObjectives: {
        assault: "Surprise Attack",
      },
    },
    forceToggles: { 
      tournamentMode: true, 
      enableLegacy: true,
      enableLegends: false,
      enableLegacyBeta: false,
      enableArc: false,
      enableNexus: false,
      enableProxy: false,
    },
    allowedFactions: ["republic", "separatist"],
  },
  "Unrestricted": {},
};

export function getRestrictionsForGamemode(gamemode: Gamemode): GamemodeRestrictions | undefined {
  const restrictions = GAMEMODE_RESTRICTIONS[gamemode];
  if (!restrictions) {
    console.warn(`No restrictions found for gamemode: "${gamemode}". Available gamemodes:`, Object.keys(GAMEMODE_RESTRICTIONS));
  }
  return restrictions;
}

export function isFactionAllowedInGamemode(faction: string, gamemode: Gamemode): boolean {
  const restrictions = getRestrictionsForGamemode(gamemode);
  if (!restrictions) {
    return true; // If no restrictions, allow all factions
  }

  // Check if faction is explicitly disallowed
  if (restrictions.disallowedFactions && restrictions.disallowedFactions.includes(faction)) {
    return false;
  }

  // Check if there's an allowed factions list and faction is not in it
  if (restrictions.allowedFactions && !restrictions.allowedFactions.includes(faction)) {
    return false;
  }

  return true; // Faction is allowed
}

export interface FleetState {
  points: number;
  totalSquadronPoints: number;
  selectedShips: {
    traits?: string[];
    shipClass?: string;
    size?: "small" | "medium" | "large" | "huge" | "280-huge";
    commander?: string;
  }[];
  selectedSquadrons: {
    ace?: boolean;
    keywords?: string[];
    "unique-class"?: string[];
  }[];
  selectedUpgrades?: {
    "unique-class"?: string[];
  }[];
  selectedAssaultObjectives?: { name?: string }[];
  selectedDefenseObjectives?: { name?: string }[];
  selectedNavigationObjectives?: { name?: string }[];
  selectedCampaignObjectives?: { name?: string }[];
  commanderCount: number;
}

export function checkFleetViolations(gamemode: Gamemode, fleet: FleetState, faction?: string): string[] {
  const restrictions = getRestrictionsForGamemode(gamemode);
  const violations: string[] = [];

  // Safety check - if no restrictions found for this gamemode, return empty violations
  if (!restrictions) {
    return violations;
  }

  // Check faction restrictions
  if (faction && restrictions.allowedFactions) {
    if (!restrictions.allowedFactions.includes(faction)) {
      violations.push(`Faction "${faction}" is not allowed in this gamemode`);
    }
  }

  if (faction && restrictions.disallowedFactions) {
    if (restrictions.disallowedFactions.includes(faction)) {
      violations.push(`Faction "${faction}" is not allowed in this gamemode`);
    }
  }

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

  // Validate objective restrictions
  if (restrictions.objectiveRestrictions) {
    const objRestrictions = restrictions.objectiveRestrictions;
    
    // Check forced objectives are present
    if (objRestrictions.forcedObjectives) {
      if (objRestrictions.forcedObjectives.assault && 
          (!fleet.selectedAssaultObjectives || fleet.selectedAssaultObjectives.length === 0 || 
           fleet.selectedAssaultObjectives[0].name !== objRestrictions.forcedObjectives.assault)) {
        violations.push(`Required assault objective "${objRestrictions.forcedObjectives.assault}" is missing`);
      }
      if (objRestrictions.forcedObjectives.defense && 
          (!fleet.selectedDefenseObjectives || fleet.selectedDefenseObjectives.length === 0 || 
           fleet.selectedDefenseObjectives[0].name !== objRestrictions.forcedObjectives.defense)) {
        violations.push(`Required defense objective "${objRestrictions.forcedObjectives.defense}" is missing`);
      }
      if (objRestrictions.forcedObjectives.navigation && 
          (!fleet.selectedNavigationObjectives || fleet.selectedNavigationObjectives.length === 0 || 
           fleet.selectedNavigationObjectives[0].name !== objRestrictions.forcedObjectives.navigation)) {
        violations.push(`Required navigation objective "${objRestrictions.forcedObjectives.navigation}" is missing`);
      }
      if (objRestrictions.forcedObjectives.campaign && 
          (!fleet.selectedCampaignObjectives || fleet.selectedCampaignObjectives.length === 0 || 
           fleet.selectedCampaignObjectives[0].name !== objRestrictions.forcedObjectives.campaign)) {
        violations.push(`Required campaign objective "${objRestrictions.forcedObjectives.campaign}" is missing`);
      }
    }
    
    // Check allowed objectives
    if (objRestrictions.allowedObjectives) {
      if (objRestrictions.allowedObjectives.assault && fleet.selectedAssaultObjectives) {
        const invalidAssault = fleet.selectedAssaultObjectives.filter(
          obj => obj.name && !objRestrictions.allowedObjectives!.assault!.includes(obj.name)
        );
        if (invalidAssault.length > 0) {
          violations.push(`Fleet contains disallowed assault objectives`);
        }
      }

      if (objRestrictions.allowedObjectives.defense && fleet.selectedDefenseObjectives) {
        const invalidDefense = fleet.selectedDefenseObjectives.filter(
          obj => obj.name && !objRestrictions.allowedObjectives!.defense!.includes(obj.name)
        );
        if (invalidDefense.length > 0) {
          violations.push(`Fleet contains disallowed defense objectives`);
        }
      }

      if (objRestrictions.allowedObjectives.navigation && fleet.selectedNavigationObjectives) {
        const invalidNavigation = fleet.selectedNavigationObjectives.filter(
          obj => obj.name && !objRestrictions.allowedObjectives!.navigation!.includes(obj.name)
        );
        if (invalidNavigation.length > 0) {
          violations.push(`Fleet contains disallowed navigation objectives`);
        }
      }

      if (objRestrictions.allowedObjectives.campaign && fleet.selectedCampaignObjectives) {
        const invalidCampaign = fleet.selectedCampaignObjectives.filter(
          obj => obj.name && !objRestrictions.allowedObjectives!.campaign!.includes(obj.name)
        );
        if (invalidCampaign.length > 0) {
          violations.push(`Fleet contains disallowed campaign objectives`);
        }
      }
    }

    // Check disallowed objectives
    if (objRestrictions.disallowedObjectives) {
      if (objRestrictions.disallowedObjectives.assault && fleet.selectedAssaultObjectives) {
        const invalidAssault = fleet.selectedAssaultObjectives.filter(
          obj => obj.name && objRestrictions.disallowedObjectives!.assault!.includes(obj.name)
        );
        if (invalidAssault.length > 0) {
          violations.push(`Fleet contains disallowed assault objectives`);
        }
      }

      if (objRestrictions.disallowedObjectives.defense && fleet.selectedDefenseObjectives) {
        const invalidDefense = fleet.selectedDefenseObjectives.filter(
          obj => obj.name && objRestrictions.disallowedObjectives!.defense!.includes(obj.name)
        );
        if (invalidDefense.length > 0) {
          violations.push(`Fleet contains disallowed defense objectives`);
        }
      }

      if (objRestrictions.disallowedObjectives.navigation && fleet.selectedNavigationObjectives) {
        const invalidNavigation = fleet.selectedNavigationObjectives.filter(
          obj => obj.name && objRestrictions.disallowedObjectives!.navigation!.includes(obj.name)
        );
        if (invalidNavigation.length > 0) {
          violations.push(`Fleet contains disallowed navigation objectives`);
        }
      }

      if (objRestrictions.disallowedObjectives.campaign && fleet.selectedCampaignObjectives) {
        const invalidCampaign = fleet.selectedCampaignObjectives.filter(
          obj => obj.name && objRestrictions.disallowedObjectives!.campaign!.includes(obj.name)
        );
        if (invalidCampaign.length > 0) {
          violations.push(`Fleet contains disallowed campaign objectives`);
        }
      }
    }
  }

  if (restrictions.requireCommander) {
    if (fleet.commanderCount !== 1) {
      violations.push("One commander upgrade is required");
    }
  }

  // Validate ship class restrictions
  if (restrictions.allowedShipClasses) {
    const invalidShips = fleet.selectedShips.filter(
      ship => ship.shipClass && !restrictions.allowedShipClasses!.includes(ship.shipClass)
    );
    if (invalidShips.length > 0) {
      violations.push(`Fleet contains disallowed ship classes: ${invalidShips.map(s => s.shipClass).join(", ")}`);
    }
  }

  if (restrictions.disallowedShipClasses) {
    const invalidShips = fleet.selectedShips.filter(
      ship => ship.shipClass && restrictions.disallowedShipClasses!.includes(ship.shipClass)
    );
    if (invalidShips.length > 0) {
      violations.push(`Fleet contains disallowed ship classes: ${invalidShips.map(s => s.shipClass).join(", ")}`);
    }
  }

  // Validate ship size restrictions
  if (restrictions.allowedShipSizes) {
    const invalidShips = fleet.selectedShips.filter(
      ship => ship.size && !restrictions.allowedShipSizes!.includes(ship.size)
    );
    if (invalidShips.length > 0) {
      violations.push(`Fleet contains disallowed ship sizes: ${invalidShips.map(s => s.size).join(", ")}`);
    }
  }

  if (restrictions.disallowedShipSizes) {
    const invalidShips = fleet.selectedShips.filter(
      ship => ship.size && restrictions.disallowedShipSizes!.includes(ship.size)
    );
    if (invalidShips.length > 0) {
      violations.push(`Fleet contains disallowed ship sizes: ${invalidShips.map(s => s.size).join(", ")}`);
    }
  }

  // Validate squadron keyword restrictions
  if (restrictions.allowedSquadronKeywords) {
    const invalidSquadrons = fleet.selectedSquadrons.filter(
      squadron => squadron.keywords?.some(keyword => !restrictions.allowedSquadronKeywords!.includes(keyword))
    );
    if (invalidSquadrons.length > 0) {
      violations.push(`Fleet contains squadrons with disallowed keywords`);
    }
  }

  if (restrictions.disallowedSquadronKeywords) {
    const invalidSquadrons = fleet.selectedSquadrons.filter(
      squadron => squadron.keywords?.some(keyword => restrictions.disallowedSquadronKeywords!.includes(keyword))
    );
    if (invalidSquadrons.length > 0) {
      violations.push(`Fleet contains squadrons with disallowed keywords`);
    }
  }

  // Validate commander restrictions
  if (restrictions.allowedCommanders) {
    const shipsWithCommanders = fleet.selectedShips.filter(ship => ship.commander);
    const invalidCommanders = shipsWithCommanders.filter(
      ship => ship.commander && !restrictions.allowedCommanders!.includes(ship.commander)
    );
    if (invalidCommanders.length > 0) {
      violations.push(`Fleet contains disallowed commanders: ${invalidCommanders.map(s => s.commander).join(", ")}`);
    }
  }

  if (restrictions.disallowedCommanders) {
    const shipsWithCommanders = fleet.selectedShips.filter(ship => ship.commander);
    const invalidCommanders = shipsWithCommanders.filter(
      ship => ship.commander && restrictions.disallowedCommanders!.includes(ship.commander)
    );
    if (invalidCommanders.length > 0) {
      violations.push(`Fleet contains disallowed commanders: ${invalidCommanders.map(s => s.commander).join(", ")}`);
    }
  }

  // Validate squadron unique-class restrictions
  if (restrictions.allowedSquadronUniqueClasses) {
    const invalidSquadrons = fleet.selectedSquadrons.filter(
      squadron => squadron["unique-class"]?.some(uc => !restrictions.allowedSquadronUniqueClasses!.includes(uc))
    );
    if (invalidSquadrons.length > 0) {
      violations.push(`Fleet contains squadrons with disallowed unique classes`);
    }
  }

  if (restrictions.disallowedSquadronUniqueClasses) {
    const invalidSquadrons = fleet.selectedSquadrons.filter(
      squadron => squadron["unique-class"]?.some(uc => restrictions.disallowedSquadronUniqueClasses!.includes(uc))
    );
    if (invalidSquadrons.length > 0) {
      violations.push(`Fleet contains squadrons with disallowed unique classes`);
    }
  }

  // Validate upgrade unique-class restrictions
  if (restrictions.allowedUpgradeUniqueClasses && fleet.selectedUpgrades) {
    const invalidUpgrades = fleet.selectedUpgrades.filter(
      upgrade => upgrade["unique-class"]?.some(uc => !restrictions.allowedUpgradeUniqueClasses!.includes(uc))
    );
    if (invalidUpgrades.length > 0) {
      violations.push(`Fleet contains upgrades with disallowed unique classes`);
    }
  }

  if (restrictions.disallowedUpgradeUniqueClasses && fleet.selectedUpgrades) {
    const invalidUpgrades = fleet.selectedUpgrades.filter(
      upgrade => upgrade["unique-class"]?.some(uc => restrictions.disallowedUpgradeUniqueClasses!.includes(uc))
    );
    if (invalidUpgrades.length > 0) {
      violations.push(`Fleet contains upgrades with disallowed unique classes`);
    }
  }

  return violations;
}

// interface ContentSources {
//   enableLegacy: boolean;
//   enableLegends: boolean;
//   enableNexus: boolean;
//   enableLegacyBeta: boolean;
//   enableArc: boolean;
// } 