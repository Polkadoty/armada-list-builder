import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { Ship, Upgrade } from './FleetBuilder';
import { useUniqueClassContext } from '../contexts/UniqueClassContext';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import Cookies from 'js-cookie';

interface UpgradeSelectorProps {
  id: string;
  upgradeType: string;
  faction: string;
  onSelectUpgrade: (upgrade: Upgrade) => void;
  onClose: () => void;
  selectedUpgrades: Upgrade[];
  shipType?: string;
  chassis?: string;
  shipSize?: string;
  shipTraits?: string[];
  currentShipUpgrades: Upgrade[];
  disqualifiedUpgrades: string[];
  disabledUpgrades: string[];
  ship: Ship
  
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
}: UpgradeSelectorProps) {
  const [loading, setLoading] = useState(true);
  const { uniqueClassNames, addUniqueClassName } = useUniqueClassContext();
  const [allUpgrades, setAllUpgrades] = useState<Upgrade[]>([]);
  const [displayedUpgrades, setDisplayedUpgrades] = useState<Upgrade[]>([]);
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

  useEffect(() => {
    const fetchUpgrades = () => {
      setLoading(true);
      const cachedUpgrades = localStorage.getItem('upgrades');
      const cachedLegacyUpgrades = localStorage.getItem('legacyUpgrades');
      const cachedLegendsUpgrades = localStorage.getItem('legendsUpgrades');
      const cachedOldLegacyUpgrades = localStorage.getItem('oldLegacyUpgrades');
      
      let allUpgrades: Upgrade[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processUpgrades = (data: UpgradeData, prefix: string = ''): Upgrade[] => {
        if (data && data.upgrades) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return Object.values(data.upgrades).map((upgrade: any) => {
            const exhaustType = upgrade.exhaust?.type || '';
            const isModification = upgrade.modification ? 'modification' : '';
            return {
              ...upgrade,
              id: prefix ? `${prefix}-${upgrade.id || upgrade.name}` : (upgrade.id || upgrade.name),
              faction: Array.isArray(upgrade.faction) ? upgrade.faction : [upgrade.faction],
              "unique-class": upgrade["unique-class"] || [],
              restrictions: {
                ...upgrade.restrictions,
                traits: upgrade.restrictions?.traits || [],
                size: upgrade.restrictions?.size || [],
                disqual_upgrades: upgrade.restrictions?.disqual_upgrades || [],
                disable_upgrades: upgrade.restrictions?.disable_upgrades || [],
                enable_upgrades: upgrade.restrictions?.enable_upgrades || [],
                disqualify_if: upgrade.restrictions?.disqualify_if || {}
              },
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

      if (cachedLegacyUpgrades) {
        const legacyUpgradeData = JSON.parse(cachedLegacyUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(legacyUpgradeData, 'legacy')];
      }

      if (cachedLegendsUpgrades) {
        const legendsUpgradeData = JSON.parse(cachedLegendsUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(legendsUpgradeData, 'legends')];
      }

      if (cachedOldLegacyUpgrades) {
        const oldLegacyUpgradeData = JSON.parse(cachedOldLegacyUpgrades);
        allUpgrades = [...allUpgrades, ...processUpgrades(oldLegacyUpgradeData, 'oldLegacy')];
      }

      const filteredUpgrades = allUpgrades.filter(upgrade => {
        const factionMatch = Array.isArray(upgrade.faction) 
          ? upgrade.faction.includes(faction) || upgrade.faction.includes('')
          : upgrade.faction === faction || upgrade.faction === '';

        let chassisMatch = true;
        if (upgradeType === 'title') {
          if (upgrade.bound_shiptype) {
            chassisMatch = upgrade.bound_shiptype === chassis;
          } else if (upgrade.restrictions?.traits?.includes('star-dreadnought')) {
            chassisMatch = shipTraits?.includes('star-dreadnought') || false;
          } else if (upgrade.restrictions?.traits?.includes('MC')) {
            chassisMatch = shipTraits?.includes('MC') || false;
          } else {
            chassisMatch = upgrade.bound_shiptype === '' || upgrade.bound_shiptype === chassis;
          }
        }

        return upgrade.type === upgradeType &&
          factionMatch &&
          chassisMatch;
      });

      setAllUpgrades(filteredUpgrades);
      setDisplayedUpgrades(filteredUpgrades);
      setLoading(false);
    };

    fetchUpgrades();
  }, [upgradeType, faction, shipType, chassis, shipSize, shipTraits, currentShipUpgrades, disqualifiedUpgrades, disabledUpgrades]);

  useEffect(() => {
    const sortAndFilterUpgrades = () => {
      let sortedUpgrades = [...allUpgrades];

      // Filter upgrades based on search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        sortedUpgrades = sortedUpgrades.filter(upgrade => {
          return upgrade.searchableText.includes(searchLower);
        });
      }

      const sortFunctions: Record<SortOption, (a: Upgrade, b: Upgrade) => number> = {
        custom: (a, b) => {
          if (a.id.startsWith('legacy') === b.id.startsWith('legacy')) return 0;
          if (a.id.startsWith('legacy')) return -1;
          if (b.id.startsWith('legacy')) return 1;
          return 0;
        },
        unique: (a, b) => (a.unique === b.unique ? 0 : a.unique ? -1 : 1),
        points: (a, b) => a.points - b.points,
        alphabetical: (a, b) => a.name.localeCompare(b.name),
      };

      const sortPriority: SortOption[] = ['custom', 'unique', 'points', 'alphabetical'];

      sortedUpgrades.sort((a, b) => {
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

      setDisplayedUpgrades(sortedUpgrades);
    };

    sortAndFilterUpgrades();
  }, [allUpgrades, activeSorts, searchQuery]);

  const isUpgradeAvailable = (upgrade: Upgrade) => {
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
      if (disqualifiedUpgrades.includes(upgrade.type) || disabledUpgrades.includes(upgrade.type)) {
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

  const handleUpgradeClick = (upgrade: Upgrade) => {
    if (isUpgradeAvailable(upgrade) && !isUpgradeGreyedOut(upgrade)) {
      onSelectUpgrade(upgrade);
      // Only add unique class names if the upgrade has them and they're not already in the context
      if (upgrade.unique) {
        addUniqueClassName(upgrade.name);
      }
      if (upgrade["unique-class"]) {
        upgrade["unique-class"].filter(uc => uc !== "").forEach(uc => addUniqueClassName(uc));
      }
    }
  };

  const validateImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://api.swarmada.wiki${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleSortToggle = (option: SortOption) => {
    setActiveSorts(prevSorts => {
      const newSorts = {
        ...prevSorts,
        [option]: prevSorts[option] === null ? 'asc' : prevSorts[option] === 'asc' ? 'desc' : null
      };
      Cookies.set(`sortState_upgrades`, JSON.stringify(newSorts), { expires: 365 });
      return newSorts;
    });
  };

  const getIconPath = (upgradeType: string) => `/icons/${upgradeType}.svg`;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30">
      <Card className="w-full h-full sm:w-11/12 sm:h-5/6 lg:w-3/4 lg:h-3/4 flex flex-col">
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
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
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {displayedUpgrades.map((upgrade) => (
                <div key={upgrade.name} className="w-full aspect-[2/3]">
                  <Button
                    onClick={() => handleUpgradeClick(upgrade)}
                    className={`p-0 overflow-hidden relative w-full h-full rounded-lg ${
                      !isUpgradeAvailable(upgrade) || isUpgradeGreyedOut(upgrade) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!isUpgradeAvailable(upgrade) || isUpgradeGreyedOut(upgrade)}
                  >
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <Image
                        src={validateImageUrl(upgrade.cardimage)}
                        alt={upgrade.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover object-center scale-[103%]"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-upgrade.png';
                        }}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2 visually-hidden">
                      <p className="text-xs sm:text-sm font-bold flex items-center justify-center">
                        {upgrade.unique && <span className="mr-1 text-yellow-500 text-xs sm:text-sm">●</span>}
                        <span className="break-words line-clamp-2 text-center">{upgrade.name}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-center">{upgrade.points} points</p>
                    </div>
                    <div className="sr-only">
                      <p>
                        {upgrade.unique && "Unique "}
                        {upgrade.name}
                      </p>
                      <p>{upgrade.points} points</p>
                      {JSON.stringify(upgrade)}
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
