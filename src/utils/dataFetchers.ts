import { Ship, Squadron, Upgrade, Objective, ContentSource } from '../types/fleet';
import { ShipModel } from '../components/ShipSelector';
import { ObjectiveModel } from '../components/ObjectiveSelector';

export const getAliasKey = (
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

const fetchFromLocalStorage = (
  key: string,
  type: "ships" | "upgrades" | "squadrons"
) => {
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
                        storageKey.includes('legacyBeta') ? 'legacyBeta' :
                        storageKey.includes('legacy') ? 'legacy' :
                        storageKey.includes('legends') ? 'legends' :
                        storageKey.includes('nexus') ? 'nexus' : 'regular'
              };
            }
          }
        } else {
          if (itemsData[key]) {
            const item = itemsData[key];
            return {
              ...item,
              source: storageKey.includes('arc') ? 'arc' :
                      storageKey.includes('legacyBeta') ? 'legacyBeta' :
                      storageKey.includes('legacy') ? 'legacy' :
                      storageKey.includes('legends') ? 'legends' :
                      storageKey.includes('nexus') ? 'nexus' : 'regular'
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

export const fetchShip = (key: string): ShipModel | null => {
  return fetchFromLocalStorage(key, "ships");
};

export const fetchUpgrade = (key: string): Upgrade | null => {
  return fetchFromLocalStorage(key, "upgrades") as Upgrade | null;
};

export const fetchSquadron = (key: string): Squadron | null => {
  return fetchFromLocalStorage(key, "squadrons") as Squadron | null;
};

export const fetchObjective = (key: string): ObjectiveModel | null => {
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
                 storageKey.includes('legacyBeta') ? 'legacyBeta' :
                 storageKey.includes('legacy') ? 'legacy' :
                 storageKey.includes('legends') ? 'legends' :
                 storageKey.includes('nexus') ? 'nexus' : 'regular'
        } as ObjectiveModel;
      }
    } catch (error) {
      console.error(`Error parsing JSON for key ${storageKey}:`, error);
    }
  }
  
  console.log(`Objective not found for key: ${key}`);
  return null;
};

export const generateUniqueShipId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ship_${timestamp}_${random}`;
}; 