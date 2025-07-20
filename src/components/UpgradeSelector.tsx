import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ContentSource, Ship, Upgrade } from './FleetBuilder';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Cookies from 'js-cookie';
import { OptimizedImage } from './OptimizedImage';
import { sanitizeImageUrl } from '../utils/dataFetcher';
import { GamemodeRestrictions } from '@/utils/gamemodeRestrictions';

export interface UpgradeSelectorProps {
  upgradeType: string;
  faction: string;
  onSelectUpgrade: (upgrade: Upgrade) => void;
  onClose: () => void;
  selectedUpgrades: Upgrade[];
  shipType: string;
  chassis: string;
  shipSize: string;
  shipTraits: string[];
  currentShipUpgrades: Upgrade[];
  disqualifiedUpgrades?: string[];
  disabledUpgrades: string[];
  ship: Ship;
  gamemodeRestrictions?: GamemodeRestrictions;
  isSquadronUpgrade?: boolean; // Add prop for squadron upgrade context
  squadronKeywords?: string[]; // Add squadron keywords for leader upgrade restrictions
}

interface UpgradeData {
  upgrades: Record<string, Upgrade>;
}

export default function UpgradeSelector({
  upgradeType,
  faction,
  onSelectUpgrade,
  onClose,
  selectedUpgrades,
  shipType,
  chassis,
  shipSize,
  shipTraits, 
  currentShipUpgrades,
  disqualifiedUpgrades,
  disabledUpgrades,
  ship,
  gamemodeRestrictions,
  isSquadronUpgrade = false,
  squadronKeywords = [],
}: UpgradeSelectorProps) {
  const [loading, setLoading] = useState(true);
  const { uniqueClassNames, addUniqueClassName } = useUniqueClassContext();
  const [allUpgrades, setAllUpgrades] = useState<Upgrade[]>([]);
  const [activeSorts, setActiveSorts] = useState<Record<SortOption, 'asc' | 'desc' | null>>(() => {
    const savedSorts = Cookies.get(`sortState_upgrades`);
    if (savedSorts) {
      return JSON.parse(savedSorts);
    }
    return {
      alphabetical: null,
      points: null,
      unique: null,
      custom: null
    };
  });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentSources, setContentSources] = useState({
    arc: Cookies.get('enableArc') === 'true',
    legacy: Cookies.get('enableLegacy') === 'true',
    legends: Cookies.get('enableLegends') === 'true',
    legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
    amg: Cookies.get('enableAMG') === 'true',
    nexus: Cookies.get('enableNexus') === 'true',
    naboo: Cookies.get('enableNaboo') === 'true'
  });

  useEffect(() => {
    const fetchUpgrades = () => {
      setLoading(true);
      const cachedUpgrades = localStorage.getItem('upgrades');
      const cachedLegacyUpgrades = localStorage.getItem('legacyUpgrades');
      const cachedLegendsUpgrades = localStorage.getItem('legendsUpgrades');
      const cachedLegacyBetaUpgrades = localStorage.getItem('legacyBetaUpgrades');
      const cachedArcUpgrades = localStorage.getItem('arcUpgrades');
      const cachedAMGUpgrades = localStorage.getItem('amgUpgrades');
      const cachedNexusUpgrades = localStorage.getItem('nexusUpgrades');
      const cachedNabooUpgrades = localStorage.getItem('nabooUpgrades');

      let allUpgrades: Upgrade[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processUpgrades = (data: UpgradeData, prefix: string = ''): Upgrade[] => {
        if (data && data.upgrades) {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          return Object.entries(data.upgrades).map(([key, upgrade]: [string, any]) => {
            const exhaustType = upgrade.exhaust?.type || '';
            const isModification = upgrade.modification ? 'modification' : '';
            return {
              ...upgrade,
              id: prefix ? `${prefix}-${key}` : key,
              cardimage: sanitizeImageUrl(upgrade.cardimage),
              alias: upgrade.alias || '',
              faction: Array.isArray(upgrade.faction) ? upgrade.faction : [upgrade.faction],
              "unique-class": upgrade["unique-class"] || [],
              restrictions: {
                ...upgrade.restrictions,
                traits: upgrade.restrictions?.traits || [],
                size: upgrade.restrictions?.size || [],
                disqual_upgrades: upgrade.restrictions?.disqual_upgrades || [],
                disable_upgrades: upgrade.restrictions?.disable_upgrades || [],
                enable_upgrades: upgrade.restrictions?.enable_upgrades || [],
                disqualify_if: upgrade.restrictions?.disqualify_if || {},
                grey_upgrades: upgrade.restrictions?.grey_upgrades || [],
              },
              source: prefix as ContentSource,
              searchableText: JSON.stringify({
                ...upgrade,
                name: upgrade.name,
                ability: upgrade.ability,
                exhaustType: exhaustType,
                isModification: isModification
              }).toLowerCase()
            };
          });
        }
        return [];
      };

      if (cachedUpgrades) {
        const upgradeData = JSON.parse(cachedUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(upgradeData)];
      }

      if (cachedAMGUpgrades) {
        const amgUpgradeData = JSON.parse(cachedAMGUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(amgUpgradeData, 'amg')];
      }

      if (cachedLegacyUpgrades) {
        const legacyUpgradeData = JSON.parse(cachedLegacyUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(legacyUpgradeData, 'legacy')];
      }

      if (cachedLegendsUpgrades) {
        const legendsUpgradeData = JSON.parse(cachedLegendsUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(legendsUpgradeData, 'legends')];
      }

      if (cachedLegacyBetaUpgrades) {
        const legacyBetaUpgradeData = JSON.parse(cachedLegacyBetaUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(legacyBetaUpgradeData, 'legacyBeta')];
      }

      if (cachedArcUpgrades) {
        const arcUpgradeData = JSON.parse(cachedArcUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(arcUpgradeData, 'arc')];
      }

      if (cachedNexusUpgrades) {
        const nexusUpgradeData = JSON.parse(cachedNexusUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(nexusUpgradeData, 'nexus')];
      }

      if (cachedNabooUpgrades) {
        const nabooUpgradeData = JSON.parse(cachedNabooUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(nabooUpgradeData, 'naboo')];
      }

      // Get errata keys from localStorage
      const errataKeys = JSON.parse(localStorage.getItem('errataKeys') || '{}');
      const upgradeErrataKeys = errataKeys.upgrades || [];
      console.log('Errata Keys for Upgrades:', upgradeErrataKeys);

      // Create a Map to group upgrades by their base name
      const upgradeGroups = new Map<string, Upgrade[]>();

      allUpgrades.forEach(upgrade => {
        // Extract base name by removing any source prefixes and errata suffixes
        const baseName = upgrade.id
          .replace(/^(legacy|legends|legacyBeta|arc|amg|nexus)-/, '') // Remove source prefix
          .replace(/-errata(-[^-]+)?$/, ''); // Remove both types of errata suffixes
        
        // console.log(`Processing upgrade: ${upgrade.id}, baseName: ${baseName}`);
        
        if (!upgradeGroups.has(baseName)) {
          upgradeGroups.set(baseName, []);
        }
        upgradeGroups.get(baseName)?.push(upgrade);
      });

      // Filter out non-errata versions when errata exists
      allUpgrades = Array.from(upgradeGroups.values()).map(group => {
        // Log group contents for debugging
        // console.log('Processing group:', group.map(u => u.id));
        
        // First try to find an AMG errata version (simple -errata suffix)
        const amgErrata = group.find(upgrade => upgrade.id.endsWith('-errata'));
        // Only apply AMG errata if the cookie is enabled
        const enableAMG = Cookies.get('enableAMG') === 'true';
        if (amgErrata && enableAMG) {
          console.log(`Found AMG errata: ${amgErrata.id} replacing ${group[0].id}`);
          return amgErrata;
        }

        // Then look for source-specific errata that's in the errata keys
        const sourceErrata = group.find(upgrade => 
          upgradeErrataKeys.includes(upgrade.id) && 
          contentSources[upgrade.source as keyof typeof contentSources]
        );
        
        if (sourceErrata) {
          console.log(`Found source errata: ${sourceErrata.id} replacing ${group[0].id}`);
          return sourceErrata;
        }

        // If no errata exists, return the base version
        const baseVersion = group.find(upgrade => 
          !upgrade.id.includes('-errata') && 
          (upgrade.source === 'regular' || contentSources[upgrade.source as keyof typeof contentSources])
        );
        
        return baseVersion || group[0];
      }).filter((upgrade): upgrade is Upgrade => upgrade !== undefined);

      const filteredUpgrades = allUpgrades.filter(upgrade => {
        const baseFactions = ['rebel', 'empire', 'republic', 'separatist'];
        const allowedFactions = [...baseFactions, '']; // Include generic upgrades
        
        // Include scum faction if custom content is enabled
        if (contentSources.legends) {
          allowedFactions.push('scum');
        }

        const factionMatch = faction === 'sandbox'
          ? Array.isArray(upgrade.faction)
            ? upgrade.faction.some(f => allowedFactions.includes(f))
            : allowedFactions.includes(upgrade.faction)
          : Array.isArray(upgrade.faction)
            ? upgrade.faction.includes(faction) || upgrade.faction.includes('')
            : upgrade.faction === faction || upgrade.faction === '';

        let chassisMatch = true;
        if (upgradeType === 'title') {
          if (upgrade.bound_shiptype) {
            chassisMatch = upgrade.bound_shiptype === chassis;
          }

          // If the title has trait restrictions, check if the ship has at least one of the required traits
          if (chassisMatch && upgrade.restrictions?.traits && upgrade.restrictions.traits.length > 0) {
            const validTraits = upgrade.restrictions.traits.filter(trait => trait.trim() !== '');
            if (validTraits.length > 0) {
              chassisMatch = shipTraits?.some(trait => validTraits.includes(trait)) ?? false;
            }
          }
        }

        return upgrade.type === upgradeType && factionMatch && chassisMatch;
      });

      setAllUpgrades(filteredUpgrades);
      setLoading(false);
    };

    fetchUpgrades();
  }, [upgradeType, faction, shipType, chassis, shipSize, shipTraits, currentShipUpgrades, disqualifiedUpgrades, disabledUpgrades, contentSources]);

  const processedUpgrades = useMemo(() => {
    let filtered = allUpgrades;
    
    // Apply search filter if needed
    if (searchQuery) {
      filtered = filtered.filter(upgrade => 
        upgrade.searchableText.includes(searchQuery.toLowerCase())
      );
    }

    // Define sort functions
    const sortFunctions: Record<SortOption, (a: Upgrade, b: Upgrade) => number> = {
      custom: (a, b) => {
        if (a.source === b.source) return 0;
        if (a.source !== 'regular' && b.source === 'regular') return -1;
        if (a.source === 'regular' && b.source !== 'regular') return 1;
        return 0;
      },
      unique: (a, b) => (a.unique === b.unique ? 0 : a.unique ? -1 : 1),
      points: (a, b) => a.points - b.points,
      alphabetical: (a, b) => a.name.localeCompare(b.name),
    };

    const sortPriority: SortOption[] = ['custom', 'unique', 'points', 'alphabetical'];

    // Apply sorting
    filtered.sort((a, b) => {
      // If no active sorts, use default sorting (unique first, then alphabetical)
      if (Object.values(activeSorts).every(sort => sort === null)) {
        if (a.unique && !b.unique) return -1;
        if (!a.unique && b.unique) return 1;
        return a.name.localeCompare(b.name);
      }

      // Apply active sorts in priority order
      for (const option of sortPriority) {
        if (activeSorts[option] !== null) {
          const result = sortFunctions[option](a, b);
          if (result !== 0) {
            return activeSorts[option] === 'asc' ? result : -result;
          }
        }
      }
      return 0;
    });

    return filtered;
  }, [allUpgrades, activeSorts, searchQuery]);

  const isUpgradeAvailable = (upgrade: Upgrade) => {
    // Check commander restrictions
    if (upgradeType === 'commander' && gamemodeRestrictions) {
      if (gamemodeRestrictions.allowedCommanders && !gamemodeRestrictions.allowedCommanders.includes(upgrade.name)) {
        return false;
      }
      if (gamemodeRestrictions.disallowedCommanders && gamemodeRestrictions.disallowedCommanders.includes(upgrade.name)) {
        return false;
      }
    }

    // Check gamemode unique-class restrictions
    if (gamemodeRestrictions) {
      // Check disallowed upgrade unique-classes
      if (gamemodeRestrictions.disallowedUpgradeUniqueClasses && upgrade['unique-class']) {
        for (const uniqueClass of gamemodeRestrictions.disallowedUpgradeUniqueClasses) {
          if (upgrade['unique-class'].includes(uniqueClass)) {
            return false;
          }
        }
      }

      // Check allowed upgrade unique-classes (if specified)
      if (gamemodeRestrictions.allowedUpgradeUniqueClasses && upgrade['unique-class']) {
        const hasAllowedUniqueClass = upgrade['unique-class'].some(uniqueClass => 
          gamemodeRestrictions.allowedUpgradeUniqueClasses?.includes(uniqueClass)
        );
        if (!hasAllowedUniqueClass) {
          return false;
        }
      }
    }

    // Check unique-class restrictions
    if (upgrade["unique-class"]?.some(uc => uc !== "" && uniqueClassNames.includes(uc))) {
      return false;
    }

    // Add check for grey_upgrades availability
    if (upgrade.restrictions?.grey_upgrades) {
      for (const greyType of upgrade.restrictions.grey_upgrades) {
        // Count how many slots of this type are available on the ship
        const totalSlots = ship.availableUpgrades.filter(u => u === greyType).length;
        // Count how many slots are already filled
        const filledSlots = currentShipUpgrades.filter(u => u.type === greyType).length;
        
        // If all slots are filled, this upgrade can't be equipped
        if (totalSlots <= filledSlots) {
          return false;
        }
      }
    }

    // Huge ships can't have enable_upgrades
    if (shipSize === 'huge' && upgrade.restrictions?.enable_upgrades && upgrade.restrictions.enable_upgrades.length > 0 && upgrade.restrictions.enable_upgrades.some(upgrade => upgrade.trim() !== '')) {
      return false;
    }

    if (shipSize === '280-huge' && upgrade.restrictions?.enable_upgrades && upgrade.restrictions.enable_upgrades.length > 0 && upgrade.restrictions.enable_upgrades.some(upgrade => upgrade.trim() !== '')) {
      return false;
    }

    
    if (upgradeType === 'title' || upgradeType === 'super-weapon') {
      // For titles and super-weapons, we'll only check for uniqueness and current ship conflicts
      if (upgrade.unique && selectedUpgrades.some(su => su.name === upgrade.name)) {
        return false;
      }
      if (currentShipUpgrades.some(su => su.name === upgrade.name)) {
        return false;
      }
    } else {
      // For other upgrade types, keep the existing checks
      if (upgrade.bound_shiptype && upgrade.bound_shiptype !== shipType) {
        return false;
      }
      if (upgrade.unique && selectedUpgrades.some(su => su.name === upgrade.name)) {
        return false;
      }
      if (currentShipUpgrades.some(su => su.name === upgrade.name)) {
        return false;
      }
      if (upgrade.modification && currentShipUpgrades.some(su => su.modification)) {
        return false;
      }
      if (disqualifiedUpgrades && disqualifiedUpgrades.includes(upgrade.type)) {
        return false;
      }
    }

    // Common checks for all upgrade types
    if (upgrade.restrictions) {

      const disqualOrDisable = [...(upgrade.restrictions.disqual_upgrades || []), ...(upgrade.restrictions.disable_upgrades || [])];
      if (currentShipUpgrades.some(su => disqualOrDisable.includes(su.type))) {
        return false;
      }

      if (upgrade.restrictions.size && upgrade.restrictions.size.length > 0 && shipSize) {
        const validSizes = upgrade.restrictions.size.filter(size => size.trim() !== '');
        if (validSizes.length > 0 && !validSizes.includes(shipSize)) {
          return false;
        }
      }

      if (upgrade.restrictions?.traits && upgrade.restrictions.traits.length > 0 && shipTraits) {
        const validTraits = upgrade.restrictions.traits.filter(trait => trait.trim() !== '');
        if (validTraits.length > 0) {
          const hasRequiredTrait = validTraits.some(trait => shipTraits.includes(trait));
          if (!hasRequiredTrait) {
            return false;
          }
        }
      }

      // Check keyword restrictions for squadron upgrades (leaders)
      if (isSquadronUpgrade && upgrade.restrictions?.keywords && upgrade.restrictions.keywords.length > 0) {
        const validKeywords = upgrade.restrictions.keywords.filter(keyword => keyword.trim() !== '');
        if (validKeywords.length > 0) {
          const hasRequiredKeyword = validKeywords.some(keyword => squadronKeywords.includes(keyword));
          if (!hasRequiredKeyword) {
            return false;
          }
        }
      }

      // Check disallowed keyword restrictions for squadron upgrades (leaders)
      if (isSquadronUpgrade && upgrade.restrictions?.["disallowed-keywords"] && upgrade.restrictions["disallowed-keywords"].length > 0) {
        const disallowedKeywords = upgrade.restrictions["disallowed-keywords"].filter(keyword => keyword.trim() !== '');
        if (disallowedKeywords.length > 0) {
          const hasDisallowedKeyword = disallowedKeywords.some(keyword => squadronKeywords.includes(keyword));
          if (hasDisallowedKeyword) {
            return false;
          }
        }
      }

      if (upgrade.restrictions.flagship === true) {
        const hasCommander = currentShipUpgrades.some(u => u.type === 'commander');
        if (!hasCommander) {
          return false;
        }
      }

      if (upgrade.restrictions.disqualify_if) {
        const disqualify = upgrade.restrictions.disqualify_if;
        if (shipSize && disqualify.size && disqualify.size.includes(shipSize)) {
          if (disqualify.has_upgrade_type) {
            const hasDisqualifyingUpgrade = disqualify.has_upgrade_type.some(type => 
              currentShipUpgrades.some(u => u.type === type) || 
              ship.availableUpgrades.includes(type)
            );
            if (hasDisqualifyingUpgrade) {
              return false;
            }
          }
        }
      }
    }
    
    return true;
  };

  const isUpgradeGreyedOut = (upgrade: Upgrade) => {
    // Check if the upgrade is restricted by gamemode
    if (upgradeType === 'commander' && gamemodeRestrictions) {
      if (gamemodeRestrictions.allowedCommanders && !gamemodeRestrictions.allowedCommanders.includes(upgrade.name)) {
        return true;
      }
      if (gamemodeRestrictions.disallowedCommanders && gamemodeRestrictions.disallowedCommanders.includes(upgrade.name)) {
        return true;
      }
    }

    // Check gamemode unique-class restrictions
    if (gamemodeRestrictions) {
      // Check disallowed upgrade unique-classes
      if (gamemodeRestrictions.disallowedUpgradeUniqueClasses && upgrade['unique-class']) {
        for (const uniqueClass of gamemodeRestrictions.disallowedUpgradeUniqueClasses) {
          if (upgrade['unique-class'].includes(uniqueClass)) {
            return true;
          }
        }
      }

      // Check allowed upgrade unique-classes (if specified)
      if (gamemodeRestrictions.allowedUpgradeUniqueClasses && upgrade['unique-class']) {
        const hasAllowedUniqueClass = upgrade['unique-class'].some(uniqueClass => 
          gamemodeRestrictions.allowedUpgradeUniqueClasses?.includes(uniqueClass)
        );
        if (!hasAllowedUniqueClass) {
          return true;
        }
      }
    }

    // Check unique-class restrictions
    if (upgrade["unique-class"] && upgrade["unique-class"].length > 0) {
      return upgrade["unique-class"].some(uc => 
        uc !== "" && uniqueClassNames.includes(uc) && 
        !selectedUpgrades.some(su => su["unique-class"]?.includes(uc))
      );
    }
    // Don't grey out title upgrades without bound_shiptype
    if (upgradeType === 'title' && !upgrade.bound_shiptype) {
      return false;
    }
    return false; // Non-unique upgrades or upgrades without a unique class are not greyed out
  };

  // New comprehensive function to get all restriction messages
  const getUpgradeRestrictionMessages = (upgrade: Upgrade): string[] => {
    const messages: string[] = [];

    // Check gamemode restrictions first
    if (upgradeType === 'commander' && gamemodeRestrictions) {
      if (gamemodeRestrictions.allowedCommanders && !gamemodeRestrictions.allowedCommanders.includes(upgrade.name)) {
        messages.push("Commander not allowed in current gamemode");
      }
      if (gamemodeRestrictions.disallowedCommanders && gamemodeRestrictions.disallowedCommanders.includes(upgrade.name)) {
        messages.push("Commander not allowed in current gamemode");
      }
    }

    // Check gamemode unique-class restrictions
    if (gamemodeRestrictions) {
      if (gamemodeRestrictions.disallowedUpgradeUniqueClasses && upgrade['unique-class']) {
        for (const uniqueClass of gamemodeRestrictions.disallowedUpgradeUniqueClasses) {
          if (upgrade['unique-class'].includes(uniqueClass)) {
            messages.push("Upgrade unique class not allowed in this gamemode");
            break;
          }
        }
      }

      if (gamemodeRestrictions.allowedUpgradeUniqueClasses && upgrade['unique-class']) {
        const hasAllowedUniqueClass = upgrade['unique-class'].some(uniqueClass => 
          gamemodeRestrictions.allowedUpgradeUniqueClasses?.includes(uniqueClass)
        );
        if (!hasAllowedUniqueClass) {
          messages.push("Upgrade unique class not allowed in this gamemode");
        }
      }
    }

    // Check bound_shiptype restrictions
    if (upgrade.bound_shiptype && upgrade.bound_shiptype !== shipType && upgradeType !== 'title' && upgradeType !== 'super-weapon') {
      messages.push(`Only works on ${upgrade.bound_shiptype} ships`);
    }

    // Check unique upgrade already selected
    if (upgrade.unique && selectedUpgrades.some(su => su.name === upgrade.name)) {
      messages.push("Unique upgrade already equipped");
    }

    // Check upgrade already equipped on this ship
    if (currentShipUpgrades.some(su => su.name === upgrade.name)) {
      messages.push("Upgrade already equipped on this ship");
    }

    // Check modification restrictions
    if (upgrade.modification && currentShipUpgrades.some(su => su.modification)) {
      messages.push("Only one modification allowed per ship");
    }

    // Check disqualified upgrades
    if (disqualifiedUpgrades && disqualifiedUpgrades.includes(upgrade.type)) {
      messages.push("Upgrade type disqualified by another upgrade");
    }

    // Check disabled upgrades
    if (disabledUpgrades && disabledUpgrades.includes(upgrade.type)) {
      messages.push("Upgrade type disabled by another upgrade");
    }

    // Check disabled by other upgrades
    if (upgrade.restrictions) {
      const disqualOrDisable = [...(upgrade.restrictions.disqual_upgrades || []), ...(upgrade.restrictions.disable_upgrades || [])];
      if (currentShipUpgrades.some(su => disqualOrDisable.includes(su.type))) {
        messages.push("Conflicts with currently equipped upgrade");
      }
    }

    // Check size restrictions
    if (upgrade.restrictions?.size && upgrade.restrictions.size.length > 0 && shipSize) {
      const validSizes = upgrade.restrictions.size.filter(size => size.trim() !== '');
      if (validSizes.length > 0 && !validSizes.includes(shipSize)) {
        messages.push(`Only works on ${validSizes.join(', ')} ships`);
      }
    }

    // Check traits restrictions
    if (upgrade.restrictions?.traits && upgrade.restrictions.traits.length > 0 && shipTraits) {
      const validTraits = upgrade.restrictions.traits.filter(trait => trait.trim() !== '');
      if (validTraits.length > 0) {
        const hasRequiredTrait = validTraits.some(trait => shipTraits.includes(trait));
        if (!hasRequiredTrait) {
          messages.push(`Requires ship trait: ${validTraits.join(' or ')}`);
        }
      }
    }

    // Check keyword restrictions for squadron upgrades
    if (isSquadronUpgrade && upgrade.restrictions?.keywords && upgrade.restrictions.keywords.length > 0) {
      const validKeywords = upgrade.restrictions.keywords.filter(keyword => keyword.trim() !== '');
      if (validKeywords.length > 0) {
        const hasRequiredKeyword = validKeywords.some(keyword => squadronKeywords.includes(keyword));
        if (!hasRequiredKeyword) {
          messages.push(`Requires squadron keyword: ${validKeywords.join(' or ')}`);
        }
      }
    }

    // Check disallowed keyword restrictions for squadron upgrades
    if (isSquadronUpgrade && upgrade.restrictions?.["disallowed-keywords"] && upgrade.restrictions["disallowed-keywords"].length > 0) {
      const disallowedKeywords = upgrade.restrictions["disallowed-keywords"].filter(keyword => keyword.trim() !== '');
      if (disallowedKeywords.length > 0) {
        const hasDisallowedKeyword = disallowedKeywords.some(keyword => squadronKeywords.includes(keyword));
        if (hasDisallowedKeyword) {
          messages.push(`Cannot be used with: ${disallowedKeywords.join(', ')}`);
        }
      }
    }

    // Check flagship restrictions
    if (upgrade.restrictions?.flagship === true) {
      const hasCommander = currentShipUpgrades.some(u => u.type === 'commander');
      if (!hasCommander) {
        messages.push("Requires a commander on this ship");
      }
    }

    // Check disqualify_if restrictions
    if (upgrade.restrictions?.disqualify_if) {
      const disqualify = upgrade.restrictions.disqualify_if;
      if (shipSize && disqualify.size && disqualify.size.includes(shipSize)) {
        if (disqualify.has_upgrade_type) {
          const hasDisqualifyingUpgrade = disqualify.has_upgrade_type.some(type => 
            currentShipUpgrades.some(u => u.type === type) || 
            ship.availableUpgrades.includes(type)
          );
          if (hasDisqualifyingUpgrade) {
            messages.push(`Cannot be used on ${shipSize} ships with ${disqualify.has_upgrade_type.join(', ')} upgrades`);
          }
        }
      }
    }

    // Check grey_upgrades restrictions
    if (upgrade.restrictions?.grey_upgrades) {
      for (const greyType of upgrade.restrictions.grey_upgrades) {
        const totalSlots = ship.availableUpgrades.filter(u => u === greyType).length;
        const filledSlots = currentShipUpgrades.filter(u => u.type === greyType).length;
        if (totalSlots <= filledSlots) {
          messages.push(`Requires available ${greyType} slot`);
          break;
        }
      }
    }

    // Check huge ship enable_upgrades restrictions
    if ((shipSize === 'huge' || shipSize === '280-huge') && upgrade.restrictions?.enable_upgrades && upgrade.restrictions.enable_upgrades.length > 0 && upgrade.restrictions.enable_upgrades.some(upgrade => upgrade.trim() !== '')) {
      messages.push("Huge ships cannot have upgrades that enable other upgrades");
    }

    // Check unique-class restrictions
    if (upgrade["unique-class"] && upgrade["unique-class"].length > 0) {
      const conflictingUniqueClasses = upgrade["unique-class"].filter(uc => 
        uc !== "" && uniqueClassNames.includes(uc) && 
        !selectedUpgrades.some(su => su["unique-class"]?.includes(uc))
      );
      if (conflictingUniqueClasses.length > 0) {
        messages.push(`Unique class already in use: ${conflictingUniqueClasses.join(', ')}`);
      }
    }

    return messages;
  };

  const handleUpgradeClick = (upgrade: Upgrade) => {
    if (isUpgradeAvailable(upgrade) && !isUpgradeGreyedOut(upgrade)) {
      onSelectUpgrade(upgrade);
      if (upgrade.unique) {
        addUniqueClassName(upgrade.name);
      }
      if (upgrade["unique-class"]) {
        upgrade["unique-class"].filter(uc => uc !== "").forEach(uc => addUniqueClassName(uc));
      }
    } else {
      // Show a message explaining why the upgrade can't be selected
      let message = "This upgrade cannot be selected because:";
      if (upgradeType === 'commander' && gamemodeRestrictions) {
        if (gamemodeRestrictions.allowedCommanders && !gamemodeRestrictions.allowedCommanders.includes(upgrade.name)) {
          message += `\n- This commander is not allowed in the current gamemode`;
        }
        if (gamemodeRestrictions.disallowedCommanders && gamemodeRestrictions.disallowedCommanders.includes(upgrade.name)) {
          message += `\n- This commander is not allowed in the current gamemode`;
        }
      }
      if (upgrade["unique-class"]?.some(uc => uc !== "" && uniqueClassNames.includes(uc))) {
        message += `\n- A unique class from this upgrade is already in use`;
      }
      // ... add other restriction messages as needed ...
      alert(message);
    }
  };



  const handleSortToggle = (option: SortOption) => {
    setActiveSorts(prevSorts => {
      const newSorts = {
        ...prevSorts,
        [option]: prevSorts[option] === null ? 'asc' : prevSorts[option] === 'asc' ? 'desc' : null
      };
      Cookies.set(`sortState_upgrades`, JSON.stringify(newSorts), { 
        expires: 365,
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production'
      });
      return newSorts;
    });
  };

  const getIconPath = (upgradeType: string) => `/icons/${upgradeType}.svg`;

  useEffect(() => {
    const checkCookies = () => {
      const newContentSources = {
        arc: Cookies.get('enableArc') === 'true',
        legacy: Cookies.get('enableLegacy') === 'true',
        legends: Cookies.get('enableLegends') === 'true',
        legacyBeta: Cookies.get('enableLegacyBeta') === 'true',
        amg: Cookies.get('enableAMG') === 'true',
        nexus: Cookies.get('enableNexus') === 'true',
        naboo: Cookies.get('enableNaboo') === 'true'
      };

      if (JSON.stringify(newContentSources) !== JSON.stringify(contentSources)) {
        setContentSources(newContentSources);
      }
    };

    checkCookies();
    const interval = setInterval(checkCookies, 1000);
    return () => clearInterval(interval);
  }, [contentSources]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30">
      <Card className="w-full h-full sm:w-[95%] sm:h-[90%] lg:w-[85%] lg:h-[85%] flex flex-col">
        <div className="p-2 sm:p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
          {showSearch ? (
            <div className="flex-grow mr-2 relative">
              <Input
                type="text"
                placeholder="Search upgrades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10"
                autoFocus
              />
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setShowSearch(true)} className="flex items-center">
              <div className="flex items-center">
                <span className="text-lg sm:text-xl lg:text-2xl font-bold mr-2">Select</span>
                <Image
                  src={getIconPath(upgradeType)}
                  alt={upgradeType}
                  width={36}
                  height={36}
                  className="mr-2 dark:invert"
                  style={{ width: 'auto', height: '1em' }}
                />
              </div>
              <Search size={20} className="ml-2" />
            </Button>
          )}
          <div className="flex items-center">
            {showSearch && (
              <Button variant="ghost" onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="mr-2">
                <X size={20} />
              </Button>
            )}
            <SortToggleGroup activeSorts={activeSorts} onToggle={handleSortToggle} selectorType="upgrades" />
            <Button variant="ghost" onClick={onClose} className="p-1 ml-2">
              <X size={20} />
            </Button>
          </div>
        </div>
        <CardContent className="p-2 sm:p-4 flex-grow overflow-auto">
          {loading ? (
            <p>Loading upgrades...</p>
          ) : (
            <div className={`grid gap-2 ${
              upgradeType === "leader" && isSquadronUpgrade 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
            }`}>
              {processedUpgrades.map((upgrade) => (
                <div key={upgrade.id} className={
                  upgradeType === "leader" && isSquadronUpgrade 
                    ? "aspect-[3.5/2.5]"  // Landscape aspect ratio for leaders
                    : "aspect-[2.5/3.5]"  // Portrait aspect ratio for other upgrades
                }>
                  <Button
                    onClick={() => handleUpgradeClick(upgrade)}
                    className={`p-0 overflow-visible relative w-full h-full rounded-lg bg-transparent ${
                      !isUpgradeAvailable(upgrade) || isUpgradeGreyedOut(upgrade) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!isUpgradeAvailable(upgrade) || isUpgradeGreyedOut(upgrade)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <OptimizedImage
                        src={upgrade.cardimage}
                        alt={upgrade.name}
                        width={upgradeType === "leader" && isSquadronUpgrade ? 350 : 250}  // Landscape width for leaders
                        height={upgradeType === "leader" && isSquadronUpgrade ? 250 : 350} // Landscape height for leaders
                        className="object-cover object-center w-full h-full"
                        onError={() => {}}
                      />
                      {(!isUpgradeAvailable(upgrade) || isUpgradeGreyedOut(upgrade)) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 p-2">
                          <div className="text-white text-xs text-center leading-tight w-full px-1">
                            <span className="break-words block" style={{ wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                            {(() => {
                              const messages = getUpgradeRestrictionMessages(upgrade);
                              if (messages.length === 0) {
                                return "Upgrade not available";
                              }
                              return messages.join(' • ');
                            })()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
