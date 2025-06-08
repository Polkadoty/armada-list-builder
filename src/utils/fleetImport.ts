import { Ship, Squadron, Objective, FleetFormat, ContentSource } from '../types/fleet';
import { ShipModel } from '../components/ShipSelector';
import { getAliasKey, fetchShip, fetchUpgrade, fetchSquadron, fetchObjective, generateUniqueShipId } from './dataFetchers';

// Fleet text preprocessing for different formats
export const preprocessFleetText = (text: string, format: FleetFormat): string => {
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

// Apply card updates from localStorage
export const applyUpdates = (fleetData: string): string => {
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
};

// Main fleet import function
export interface FleetImportResult {
  success: boolean;
  ships: Ship[];
  squadrons: Squadron[];
  objectives: {
    assault: Objective[];
    defense: Objective[];
    navigation: Objective[];
  };
  fleetName: string;
  points: {
    total: number;
    ships: number;
    squadrons: number;
  };
  skippedItems: string[];
  error?: string;
}

export const importFleet = (
  importText: string, 
  format: FleetFormat, 
  faction: string
): FleetImportResult => {
  console.log("Starting fleet import with format:", format);
  
  const result: FleetImportResult = {
    success: false,
    ships: [],
    squadrons: [],
    objectives: { assault: [], defense: [], navigation: [] },
    fleetName: '',
    points: { total: 0, ships: 0, squadrons: 0 },
    skippedItems: []
  };

  try {
    // Load aliases first
    const aliases = JSON.parse(localStorage.getItem("aliases") || "{}");
    const processedText = preprocessFleetText(importText, format);
    console.log("Preprocessed fleet text:", processedText);
    
    // Then apply any card updates
    const updatedFleetText = applyUpdates(processedText);
    console.log("Updated fleet text:", updatedFleetText);
    
    // Use the updated text for the rest of the import process
    const lines = updatedFleetText.split("\n");

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
        result.error = "Could not determine faction from fleet list";
        return result;
      }
    }

    const normalizedCurrentFaction = faction.toLowerCase();

    if (normalizedImportedFaction !== normalizedCurrentFaction) {
      result.error = `Fleet is for ${normalizedImportedFaction} but current faction is ${normalizedCurrentFaction}`;
      return result;
    }

    let processingSquadrons = false;
    let totalPoints = 0;
    let squadronPoints = 0;
    let currentShipId: string | null = null;

    const addShipToFleet = (shipName: string, shipPoints: string): Ship | null => {
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
          }

          const newShip: Ship = {
            ...shipModel,
            id: generateUniqueShipId(),
            assignedUpgrades: [],
            availableUpgrades: shipModel.upgrades || [],
            size: shipModel.size || "small",
            searchableText: shipModel.searchableText || "",
            source: source,
            chassis: shipModel.chassis || shipName,
          };
          return newShip;
        } else {
          console.log(`Ship not found: ${shipName}`);
          result.skippedItems.push(shipName);
        }
      } else {
        console.log(`Ship key not found in aliases: ${shipName}`);
        result.skippedItems.push(shipName);
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
          result.fleetName = fleetNameMatch[1].trim();
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
        (line.startsWith("Assault:") || line.startsWith("Defense:") || line.startsWith("Navigation:") || 
         line.startsWith("Assault Objective:") || line.startsWith("Defense Objective:") || line.startsWith("Navigation Objective:"))
      ) {
        // Handle objectives
        const [type, namesString] = line.split(":");
        const objectiveNames = namesString.split(",").map(name => name.trim()).filter(Boolean);
        
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
                  result.objectives.assault.push(objective as Objective);
                  break;
                case "defense":
                  result.objectives.defense.push(objective as Objective);
                  break;
                case "navigation":
                  result.objectives.navigation.push(objective as Objective);
                  break;
              }
            } else {
              console.log(`Objective not found: ${objectiveName}`);
              result.skippedItems.push(objectiveName);
            }
          } else {
            console.log(`Objective key not found in aliases: ${objectiveName}`);
            result.skippedItems.push(objectiveName);
          }
        }
      } else if (line.startsWith(" Name:") || line.startsWith("Name:")) {
        // Handle fleet name with or without leading space
        const fleetNameMatch = line.match(/Name:\s*(.+)/);
        if (fleetNameMatch) {
          result.fleetName = fleetNameMatch[1].trim();
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
            result.ships.push(newShip);
            currentShipId = newShip.id;
          }
        }
      } else if (!processingSquadrons && line.startsWith("•") && currentShipId) {
        // Handle upgrades
        const upgradeMatch = line.match(/^•\s*(.+?)\s*\((\d+)\)/);
        if (upgradeMatch) {
          const [, upgradeName, upgradePoints] = upgradeMatch;
          const upgradeKey = getAliasKey(aliases, `${upgradeName} (${upgradePoints})`);
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
                }
              }

              // Find the current ship and add the upgrade
              const shipIndex = result.ships.findIndex(s => s.id === currentShipId);
              if (shipIndex !== -1) {
                const existingUpgradesOfType = result.ships[shipIndex].assignedUpgrades.filter(
                  u => u.type === upgrade.type
                );
                const nextSlot = existingUpgradesOfType.length;
                
                result.ships[shipIndex].assignedUpgrades.push({
                  ...upgrade,
                  source,
                  slotIndex: nextSlot
                });
              }
            } else {
              console.log(`Upgrade not found: ${upgradeName}`);
              result.skippedItems.push(upgradeName);
            }
          } else {
            console.log(`Upgrade key not found in aliases: ${upgradeName}`);
            result.skippedItems.push(upgradeName);
          }
        }
      } else if (processingSquadrons && !line.startsWith("=")) {
        // Handle squadrons
        const squadronMatch = line.match(/^•?\s*(?:(\d+)\s*x\s*)?(.+?)\s*\((\d+)\)/);
        if (squadronMatch) {
          const [, countStr, squadronName, totalPoints] = squadronMatch;
          const count = countStr ? parseInt(countStr) : 1;
          const pointsPerSquadron = Math.round(parseInt(totalPoints) / count);
          
          const squadronKey = getAliasKey(aliases, `${squadronName} (${pointsPerSquadron})`);
          console.log(`Found squadron: ${squadronName} (${pointsPerSquadron}) (count: ${count})`);
          
          if (squadronKey) {
            const squadron = fetchSquadron(squadronKey);
            console.log(`Fetched squadron for key: ${squadronKey}`, squadron);
            
            if (squadron) {
              console.log(`Selecting squadron:`, squadron);
              let source: ContentSource = "regular";
              if (squadronName.includes("[LegacyBeta]")) {
                source = "legacyBeta";
              } else if (squadronName.includes("[Legacy]")) {
                source = "legacy";
              } else if (squadronName.includes("[Legends]")) {
                source = "legends";
              } else if (squadronName.includes("[ARC]")) {
                source = "arc";
              } else if (squadronName.includes("[Nexus]")) {
                source = "nexus";
              }
              
              const newSquadron: Squadron = {
                ...squadron,
                id: `squadron_${Date.now()}_${Math.random()}`,
                source,
                count
              };
              
              result.squadrons.push(newSquadron);
            }
          } else {
            console.log(`Squadron key not found in aliases: ${squadronName} (${pointsPerSquadron})`);
            result.skippedItems.push(`${squadronName} (${pointsPerSquadron})`);
          }
        }
      }
    }

    // Calculate points
    result.points.ships = result.ships.reduce((total, ship) => {
      return total + ship.points + ship.assignedUpgrades.reduce((upgradeTotal, upgrade) => upgradeTotal + upgrade.points, 0);
    }, 0);

    result.points.squadrons = result.squadrons.reduce((total, squadron) => {
      return total + (squadron.points * squadron.count);
    }, 0);

    result.points.total = result.points.ships + result.points.squadrons;

    result.success = true;
    return result;

  } catch (error) {
    console.error('Fleet import error:', error);
    result.error = error instanceof Error ? error.message : 'Unknown import error';
    return result;
  }
}; 