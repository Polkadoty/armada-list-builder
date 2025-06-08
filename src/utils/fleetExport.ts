import { Ship, Squadron, Objective, ContentSource } from '../types/fleet';

// Helper function to format the objective source
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
    case 'nexus':
      return '[Nexus]';
    default:
      return '';
  }
};

interface FleetExportData {
  fleetName: string;
  faction: string;
  selectedShips: Ship[];
  selectedSquadrons: Squadron[];
  selectedAssaultObjectives: Objective[];
  selectedDefenseObjectives: Objective[];
  selectedNavigationObjectives: Objective[];
  points: number;
  totalSquadronPoints: number;
}

export const generateExportText = (data: FleetExportData): string => {
  const {
    fleetName,
    faction,
    selectedShips,
    selectedSquadrons,
    selectedAssaultObjectives,
    selectedDefenseObjectives,
    selectedNavigationObjectives,
    points,
    totalSquadronPoints
  } = data;

  let text = " Name: " + fleetName + "\n";
  text += "Faction: " + faction.charAt(0).toUpperCase() + faction.slice(1) + "\n";

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

  text += "Squadrons:\n";
  if (selectedSquadrons.length > 0) {
    const groupedSquadrons = selectedSquadrons.reduce((acc, squadron) => {
      const sourceSpace = squadron.release === "AMG Final Errata" ? "" : " ";
      const key =
        squadron.unique || squadron["ace-name"]
          ? (squadron["ace-name"] || squadron.name) + 
            " - " + squadron.name + 
            (squadron.source && squadron.source !== "regular" && squadron.source !== "amg" 
              ? sourceSpace + formatSource(squadron.source) 
              : "") + 
            " (" + squadron.points + ")"
          : squadron.name + 
            (squadron.source && squadron.source !== "regular" && squadron.source !== "amg"
              ? sourceSpace + formatSource(squadron.source) 
              : "") + 
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
}; 