import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { useUser } from "@auth0/nextjs-auth0/client";
import { imageDb } from "@/lib/imageDb";
import { useRouter } from 'next/router';
type ContentType = "ship" | "squadron" | "upgrade" | "objective";

interface ShipData {
  _id: string;
  type: "chassis";
  chassis_name: string;
  size: "small" | "medium" | "large" | "x-large" | "huge";
  hull: number;
  speed: {
    "1": number[];
    "2": number[];
    "3": number[];
    "4": number[];
  };
  shields: {
    front: number;
    rear: number;
    left: number;
    right: number;
    left_aux: number;
    right_aux: number;
  };
  hull_zones: {
    frontoffset: number;
    centeroffset: number;
    rearoffset: number;
    frontangle: number;
    centerangle: number;
    rearangle: number;
  };
  silhouette: string;
  blueprint: string;
  models: {
    [key: string]: ShipModel;
  };
}

interface ShipModel {
  author: string;
  alias: "Local";
  team: "local";
  release: "local";
  expansion: "local";
  _id: string;
  type: "ship";
  chassis: string;
  name: string;
  faction: string;
  unique: boolean;
  traits: string[];
  points: number;
  tokens: {
    def_scatter: number;
    def_evade: number;
    def_brace: number;
    def_redirect: number;
    def_contain: number;
    def_salvo: number;
  };
  values: {
    command: number;
    squadron: number;
    engineer: number;
  };
  upgrades: string[];
  armament: {
    asa: number[];
    front: number[];
    rear: number[];
    left: number[];
    right: number[];
    left_aux: number[];
    right_aux: number[];
    special: number[];
  };
  artwork: string;
  cardimage: string;
}

interface SquadronData {
  _id: string;
  type: "squadron";
  faction: string;
  squadron_type: string;
  name: string;
  "ace-name"?: string;
  "unique-class": string[];
  irregular: boolean;
  hull: number;
  speed: number;
  tokens: {
    def_scatter: number;
    def_evade: number;
    def_brace: number;
  };
  armament: {
    "anti-squadron": number[];
    "anti-ship": number[];
  };
  abilities: {
    adept: number;
    "ai-battery": number;
    "ai-antisquadron": number;
    assault: boolean;
    bomber: boolean;
    cloak: boolean;
    counter: number;
    dodge: number;
    escort: boolean;
    grit: boolean;
    heavy: boolean;
    intel: boolean;
    relay: number;
    rogue: boolean;
    scout: boolean;
    screen: boolean;
    snipe: number;
    strategic: boolean;
    swarm: boolean;
  };
  ability: string;
  unique: boolean;
  ace: boolean;
  points: number;
  silhouette: string;
  artwork: string;
  cardimage: string;
}

interface UpgradeData {
  _id: string;
  type: string;
  faction: string[];
  name: string;
  "unique-class": string[];
  ability: string;
  unique: boolean;
  points: number;
  modification: boolean;
  bound_shiptype: string;
  restrictions: {
    traits: string[];
    size: string[];
    disqual_upgrades: string[];
    disable_upgrades: string[];
    enable_upgrades: string[];
    flagship: boolean;
  };
  start_command: {
    type: string;
    start_icon: string[];
    start_amount: number;
  };
  exhaust: {
    type: string;
    ready_token: string[];
    ready_amount: number;
  };
  artwork: string;
  cardimage: string;
  author: string;
  alias: string;
  team: string;
  release: string;
  expansion: string;
}

const initialShipData: ShipData = {
  _id: "",
  type: "chassis",
  chassis_name: "",
  size: "small",
  hull: 4,
  speed: {
    "1": [1],
    "2": [1, 1],
    "3": [0, 1, 0],
    "4": []
  },
  shields: {
    front: 0,
    rear: 0,
    left: 0,
    right: 0,
    left_aux: 0,
    right_aux: 0
  },
  hull_zones: {
    frontoffset: 0,
    centeroffset: 0,
    rearoffset: 0,
    frontangle: 0,
    centerangle: 0,
    rearangle: 0
  },
  silhouette: "",
  blueprint: "",
  models: {}
};

const initialModelData: ShipModel = {
  author: "",
  alias: "Local",
  team: "local",
  release: "local",
  expansion: "local",
  _id: "",
  type: "ship",
  chassis: "",
  name: "",
  faction: "empire",
  unique: false,
  traits: [],
  points: 0,
  tokens: {
    def_scatter: 0,
    def_evade: 0,
    def_brace: 0,
    def_redirect: 0,
    def_contain: 0,
    def_salvo: 0
  },
  values: {
    command: 1,
    squadron: 1,
    engineer: 1
  },
  upgrades: [],
  armament: {
    asa: [0, 0, 0],
    front: [0, 0, 0],
    rear: [0, 0, 0],
    left: [0, 0, 0],
    right: [0, 0, 0],
    left_aux: [0, 0, 0],
    right_aux: [0, 0, 0],
    special: [0, 0, 0]
  },
  artwork: "",
  cardimage: ""
};

const initialSquadronData: SquadronData = {
  _id: "",
  type: "squadron",
  faction: "empire",
  squadron_type: "",
  name: "",
  "unique-class": [],
  irregular: false,
  hull: 4,
  speed: 3,
  tokens: {
    def_scatter: 0,
    def_evade: 0,
    def_brace: 0
  },
  armament: {
    "anti-squadron": [0, 0, 0],
    "anti-ship": [0, 0, 0]
  },
  abilities: {
    adept: 0,
    "ai-battery": 0,
    "ai-antisquadron": 0,
    assault: false,
    bomber: false,
    cloak: false,
    counter: 0,
    dodge: 0,
    escort: false,
    grit: false,
    heavy: false,
    intel: false,
    relay: 0,
    rogue: false,
    scout: false,
    screen: false,
    snipe: 0,
    strategic: false,
    swarm: false
  },
  ability: "",
  unique: false,
  ace: false,
  points: 0,
  silhouette: "",
  artwork: "",
  cardimage: ""
};

const initialUpgradeData: UpgradeData = {
  _id: "",
  type: "turbolaser",
  faction: [],
  name: "",
  "unique-class": [],
  ability: "",
  unique: false,
  points: 0,
  modification: false,
  bound_shiptype: "",
  restrictions: {
    traits: [],
    size: [],
    disqual_upgrades: [],
    disable_upgrades: [],
    enable_upgrades: [],
    flagship: false
  },
  start_command: {
    type: "",
    start_icon: [],
    start_amount: 0
  },
  exhaust: {
    type: "",
    ready_token: [],
    ready_amount: 0
  },
  artwork: "",
  cardimage: "",
  author: "",
  alias: "Local",
  team: "local",
  release: "local",
  expansion: "local"
};

const upgradeTypes = [
  "commander",
  "officer",
  "weapons-team",
  "support-team",
  "fleet-command",
  "fleet-support",
  "offensive-retro",
  "weapons-team-offensive-retro",
  "defensive-retro",
  "experimental-retro",
  "turbolaser",
  "ion-cannon",
  "ordnance",
  "super-weapon",
  "title"
];

const shipUpgradeTypes = [
  "commander",
  "officer",
  "weapons-team",
  "support-team",
  "fleet-command",
  "fleet-support",
  "offensive-retro",
  "defensive-retro",
  "experimental-retro",
  "turbolaser",
  "ion-cannon",
  "ordnance",
  "super-weapon",
  "title"
];

const UpgradeSlotCounter = ({ 
  label, 
  count, 
  onChange 
}: { 
  label: string;
  count: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30 rounded-lg">
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onChange(Math.max(0, count - 1))}
      >
        -
      </Button>
      <span className="w-8 text-center">{count}</span>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onChange(count + 1)}
      >
        +
      </Button>
    </div>
  </div>
);

export function CardBuilder() {
  const { user } = useUser();
  const [contentType, setContentType] = useState<ContentType>("ship");
  const [image, setImage] = useState<File | null>(null);
  const [shipData, setShipData] = useState<ShipData>(initialShipData);
  const [currentModel, setCurrentModel] = useState<ShipModel>({
    ...initialModelData,
    author: user?.email || "anonymous"
  });
  const [advancedMode, setAdvancedMode] = useState(false);
  const [squadronData, setSquadronData] = useState<SquadronData>(initialSquadronData);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [upgradeData, setUpgradeData] = useState<UpgradeData>(initialUpgradeData);

  const factionOptions = [
    { label: "Empire", value: "empire" },
    { label: "Rebel", value: "rebel" },
    { label: "Republic", value: "republic" },
    { label: "Separatist", value: "separatist" }
  ];

  useEffect(() => {
    imageDb.init().catch(console.error);
    
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      // Reset all state
      setContentType("ship");
      setImage(null);
      setShipData(initialShipData);
      setCurrentModel({
        ...initialModelData,
        author: user?.email || "anonymous"
      });
      setAdvancedMode(false);
      setSquadronData(initialSquadronData);
      setImagePreview(null);
    };
  }, []); // Empty dependency array since this is for mount/unmount

  const handleImageUpload = async (file: File) => {
    try {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const prefix = contentType === "ship" ? "ship_" : contentType === "squadron" ? "squadron_" : contentType === "upgrade" ? "upgrade_" : contentType === "objective" ? "objective_" : "";
        const imageKey = `${prefix}${file.name}`;
        
        await imageDb.saveImage(imageKey, base64String);
        if (contentType === "ship") {
          setCurrentModel(prev => ({...prev, cardimage: imageKey}));
        } else if (contentType === "squadron") {
          setSquadronData(prev => ({...prev, cardimage: imageKey}));
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleSaveShip = () => {
    const slugifyName = (name: string) => {
      return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const chassisId = slugifyName(shipData.chassis_name);
    const modelId = slugifyName(currentModel.name);
    const localShips = JSON.parse(localStorage.getItem("localShips") || "{ \"ships\": {} }");
    
    const updatedModel = {
      ...currentModel,
      _id: modelId,
      chassis: shipData.chassis_name,
      author: user?.email || "anonymous",
      cardimage: image ? `ship_${image.name}` : ""
    };

    // Create a new ship with the model included in its models object
    const newShip = {
      ...shipData,
      _id: chassisId,
      models: {
        [modelId]: updatedModel
      }
    };

    localShips.ships[chassisId] = newShip;
    localStorage.setItem("localShips", JSON.stringify(localShips));
  };

  const handleArmamentChange = (key: string, index: number, value: string) => {
    const newArmament = [...(currentModel.armament[key as keyof typeof currentModel.armament] as number[])];
    newArmament[index] = parseInt(value) || 0;
    setCurrentModel({
      ...currentModel,
      armament: {
        ...currentModel.armament,
        [key]: newArmament
      }
    });
  };

  useEffect(() => {
    let newUpgrades = [...currentModel.upgrades];
    
    // Remove title and commander if they exist
    newUpgrades = newUpgrades.filter(u => u !== 'title' && u !== 'commander');
    
    // Add commander at the beginning if not flotilla
    if (!currentModel.traits.includes('flotilla')) {
      newUpgrades.unshift('commander');
    }
    
    // Calculate weapons-team-offensive-retro slots
    const weaponsTeamCount = newUpgrades.filter(u => u === 'weapons-team').length;
    const offensiveRetroCount = newUpgrades.filter(u => u === 'offensive-retro').length;
    const possibleCombos = Math.min(weaponsTeamCount, offensiveRetroCount);
    
    // Remove all existing weapons-team-offensive-retro
    newUpgrades = newUpgrades.filter(u => u !== 'weapons-team-offensive-retro');
    
    // Add the calculated number of weapons-team-offensive-retro
    for (let i = 0; i < possibleCombos; i++) {
      newUpgrades.push('weapons-team-offensive-retro');
    }
    
    // Add title at the end
    newUpgrades.push('title');
    
    setCurrentModel(prev => ({...prev, upgrades: newUpgrades}));
  }, [currentModel.traits, currentModel.upgrades]);

  const handleSaveSquadron = () => {
    const slugifyName = (name: string) => {
      return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const aceName = squadronData["ace-name"] || "";
    const baseName = squadronData.name;
    const fullName = aceName ? `${aceName}-${baseName}` : baseName;
    const squadronId = slugifyName(fullName);
    
    const localSquadrons = JSON.parse(localStorage.getItem("localSquadrons") || "{ \"squadrons\": {} }");
    
    const updatedSquadron = {
      author: user?.email || "anonymous",
      alias: "Local",
      team: "local",
      release: "local",
      expansion: "local",
      _id: squadronId,
      type: "squadron",
      faction: squadronData.faction,
      squadron_type: squadronId,
      name: squadronData.name,
      "ace-name": aceName,
      "unique-class": squadronData["unique-class"],
      irregular: squadronData.irregular,
      hull: squadronData.hull,
      speed: squadronData.speed,
      tokens: squadronData.tokens,
      armament: squadronData.armament,
      abilities: squadronData.abilities,
      ability: squadronData.ability,
      unique: squadronData.unique,
      ace: squadronData.ace,
      points: squadronData.points,
      silhouette: squadronData.silhouette,
      artwork: squadronData.artwork,
      cardimage: image ? `squadron_${image.name}` : ""
    };

    localSquadrons.squadrons[squadronId] = updatedSquadron;
    localStorage.setItem("localSquadrons", JSON.stringify(localSquadrons));
  };

  useEffect(() => {
    imageDb.init().catch(console.error);
    
    // Cleanup function
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]); // Add imagePreview to dependencies

  const handleSaveUpgrade = () => {
    const slugifyName = (name: string) => {
      return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };

    const upgradeId = slugifyName(upgradeData.name);
    const localUpgrades = JSON.parse(localStorage.getItem("localUpgrades") || "{ \"upgrades\": {} }");
    
    const updatedUpgrade = {
      ...upgradeData,
      _id: upgradeId,
      author: user?.email || "anonymous",
      cardimage: image ? `upgrade_${image.name}` : ""
    };

    localUpgrades.upgrades[upgradeId] = updatedUpgrade;
    localStorage.setItem("localUpgrades", JSON.stringify(localUpgrades));
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Tabs value={contentType} onValueChange={(value) => setContentType(value as ContentType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ship" className="relative">
              Ship
              {contentType === "ship" && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger value="squadron" className="relative">
              Squadron
              {contentType === "squadron" && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="relative">
              Upgrade
              {contentType === "upgrade" && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger value="objective" className="relative">
              Objective
              {contentType === "objective" && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center space-x-2">
          <Switch
            checked={advancedMode}
            onCheckedChange={setAdvancedMode}
            className="custom-switch"
          />
          <Label>Advanced Mode</Label>
        </div>
      </div>

      {contentType === "ship" && (
        <div className="mt-4 space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Chassis Name</Label>
                <Input 
                  value={shipData.chassis_name}
                  onChange={(e) => setShipData({...shipData, chassis_name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <Label>Model Name</Label>
                <Input 
                  value={currentModel.name}
                  onChange={(e) => setCurrentModel({...currentModel, name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Traits</Label>
                <Input 
                  value={currentModel.traits.join(', ')}
                  onChange={(e) => {
                    const traitsString = e.target.value;
                    const traitsArray = traitsString
                      .split(',')
                      .map(t => t.trim())
                      .filter(t => t !== '');
                    setCurrentModel({
                      ...currentModel,
                      traits: traitsArray
                    });
                  }}
                  placeholder="Enter traits, comma-separated (e.g., flotilla, transport)"
                />
              </div>
              <div className="space-y-1">
                <Label>Points</Label>
                <Input 
                  type="number"
                  value={currentModel.points}
                  onChange={(e) => setCurrentModel({...currentModel, points: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-1">
                <Label>Faction</Label>
                <Select 
                  value={currentModel.faction}
                  onValueChange={(value) => setCurrentModel({...currentModel, faction: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {factionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={currentModel.unique}
                  onCheckedChange={(checked) => setCurrentModel({...currentModel, unique: checked})}
                  className="custom-switch"
                />
                <Label>Unique</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={currentModel.traits.includes("flotilla")}
                  onCheckedChange={(checked) => {
                    const newTraits = checked 
                      ? [...currentModel.traits, "flotilla"]
                      : currentModel.traits.filter(t => t !== "flotilla");
                    setCurrentModel({...currentModel, traits: newTraits});
                  }}
                  className="custom-switch"
                />
                <Label>Flotilla</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <ImageUpload onUpload={handleImageUpload} />
                {image && (
                  <div className="w-32 h-32 relative">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleSaveShip}
                variant="default"
              >
                Save Ship
              </Button>
            </div>
          </div>

          {advancedMode && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-4">
                <Label>Shields</Label>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(shipData.shields).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label>{key.replace('_', ' ').toUpperCase()}</Label>
                      <Input 
                        type="number"
                        value={value}
                        onChange={(e) => setShipData({
                          ...shipData,
                          shields: {
                            ...shipData.shields,
                            [key]: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Speed Configuration</Label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(shipData.speed).map(([speed, values]) => (
                    <div key={speed} className="space-y-2">
                      <Label>Speed {speed}</Label>
                      <div className="flex gap-2">
                        {Array.from({ length: parseInt(speed) }).map((_, index) => (
                          <Input 
                            key={index}
                            type="text"
                            className="w-12 text-center"
                            value={values[index] === 0 ? '-' : values[index] === 1 ? 'I' : 'II'}
                            onChange={(e) => {
                              const newSpeed = [...values];
                              newSpeed[index] = e.target.value === '-' ? 0 : e.target.value === 'I' ? 1 : 2;
                              setShipData({
                                ...shipData,
                                speed: {
                                  ...shipData.speed,
                                  [speed]: newSpeed
                                }
                              });
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Hull Zones</Label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(shipData.hull_zones).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</Label>
                      <Input 
                        type="number"
                        value={value}
                        onChange={(e) => setShipData({
                          ...shipData,
                          hull_zones: {
                            ...shipData.hull_zones,
                            [key]: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Available Upgrades</Label>
                <div className="grid grid-cols-2 gap-2">
                  {shipUpgradeTypes
                    .filter(type => type !== 'title' && type !== 'commander')
                    .map((upgradeType) => {
                      const count = currentModel.upgrades.filter(u => u === upgradeType).length;
                      return (
                        <UpgradeSlotCounter
                          key={upgradeType}
                          label={upgradeType.replace('-', ' ').toUpperCase()}
                          count={count}
                          onChange={(newCount) => {
                            const currentCount = count;
                            const newUpgrades = [...currentModel.upgrades];
                            
                            if (newCount > currentCount) {
                              // Add upgrades
                              for (let i = 0; i < newCount - currentCount; i++) {
                                newUpgrades.push(upgradeType);
                              }
                            } else {
                              // Remove upgrades
                              for (let i = 0; i < currentCount - newCount; i++) {
                                const index = newUpgrades.lastIndexOf(upgradeType);
                                if (index !== -1) {
                                  newUpgrades.splice(index, 1);
                                }
                              }
                            }
                            
                            setCurrentModel({...currentModel, upgrades: newUpgrades});
                          }}
                        />
                      );
                    })}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Armament</Label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(currentModel.armament)
                    .filter(([key]) => {
                      if (key === 'cardimage') return false;
                      if ((key === 'left_aux' || key === 'right_aux') && 
                          !['x-large', 'huge'].includes(shipData.size)) return false;
                      if (key === 'special' && !currentModel.traits.includes('special')) return false;
                      return true;
                    })
                    .map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs">{key.replace('_', ' ').toUpperCase()}</Label>
                        <div className="flex gap-1">
                          <Input 
                            type="number"
                            className="w-12 h-8 text-sm p-1 text-red-500"
                            value={value[0] || 0}
                            onChange={(e) => handleArmamentChange(key, 0, e.target.value)}
                          />
                          <Input 
                            type="number"
                            className="w-12 h-8 text-sm p-1 text-blue-500"
                            value={value[1] || 0}
                            onChange={(e) => handleArmamentChange(key, 1, e.target.value)}
                          />
                          <Input 
                            type="number"
                            className="w-12 h-8 text-sm p-1"
                            value={value[2] || 0}
                            onChange={(e) => handleArmamentChange(key, 2, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {contentType === "squadron" && (
        <div className="mt-4 space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Squadron Name</Label>
                <Input 
                  value={squadronData.name}
                  onChange={(e) => setSquadronData({...squadronData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <Label>Faction</Label>
                <Select 
                  value={squadronData.faction}
                  onValueChange={(value) => setSquadronData({...squadronData, faction: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {factionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Ace Name</Label>
                <Input 
                  value={squadronData["ace-name"] || ""}
                  onChange={(e) => setSquadronData({...squadronData, "ace-name": e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Hull</Label>
                <Input 
                  type="number"
                  value={squadronData.hull}
                  onChange={(e) => setSquadronData({...squadronData, hull: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-1">
                <Label>Speed</Label>
                <Input 
                  type="number"
                  value={squadronData.speed}
                  onChange={(e) => setSquadronData({...squadronData, speed: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-1">
                <Label>Points</Label>
                <Input 
                  type="number"
                  value={squadronData.points}
                  onChange={(e) => setSquadronData({...squadronData, points: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={squadronData.unique}
                  onCheckedChange={(checked) => setSquadronData({...squadronData, unique: checked})}
                  className="custom-switch"
                />
                <Label>Unique</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={squadronData.ace}
                  onCheckedChange={(checked) => setSquadronData({...squadronData, ace: checked})}
                  className="custom-switch"
                />
                <Label>Ace</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={squadronData.irregular}
                  onCheckedChange={(checked) => setSquadronData({...squadronData, irregular: checked})}
                  className="custom-switch"
                />
                <Label>Irregular</Label>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Defense Tokens</Label>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(squadronData.tokens).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label>{key.replace('def_', '').toUpperCase()}</Label>
                    <Input 
                      type="number"
                      value={value}
                      onChange={(e) => setSquadronData({
                        ...squadronData,
                        tokens: {
                          ...squadronData.tokens,
                          [key]: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {advancedMode && (
              <>
                <div className="space-y-4">
                  <Label>Squadron Abilities</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(squadronData.abilities).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        {typeof value === 'boolean' ? (
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => setSquadronData({
                              ...squadronData,
                              abilities: {
                                ...squadronData.abilities,
                                [key]: checked
                              }
                            })}
                            className="custom-switch"
                          />
                        ) : (
                          <Input 
                            type="number"
                            className="w-16"
                            value={value}
                            onChange={(e) => setSquadronData({
                              ...squadronData,
                              abilities: {
                                ...squadronData.abilities,
                                [key]: parseInt(e.target.value) || 0
                              }
                            })}
                          />
                        )}
                        <Label>{key.replace(/-/g, ' ').toUpperCase()}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Armament</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(squadronData.armament).map(([key, values]) => (
                      <div key={key} className="space-y-2">
                        <Label>{key.replace('-', ' ').toUpperCase()}</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="number"
                            className="w-16 text-red-500"
                            value={values[0]}
                            onChange={(e) => {
                              const newValues = [...values];
                              newValues[0] = parseInt(e.target.value) || 0;
                              setSquadronData({
                                ...squadronData,
                                armament: {
                                  ...squadronData.armament,
                                  [key]: newValues
                                }
                              });
                            }}
                          />
                          <Input 
                            type="number"
                            className="w-16 text-blue-500"
                            value={values[1]}
                            onChange={(e) => {
                              const newValues = [...values];
                              newValues[1] = parseInt(e.target.value) || 0;
                              setSquadronData({
                                ...squadronData,
                                armament: {
                                  ...squadronData.armament,
                                  [key]: newValues
                                }
                              });
                            }}
                          />
                          <Input 
                            type="number"
                            className="w-16"
                            value={values[2]}
                            onChange={(e) => {
                              const newValues = [...values];
                              newValues[2] = parseInt(e.target.value) || 0;
                              setSquadronData({
                                ...squadronData,
                                armament: {
                                  ...squadronData.armament,
                                  [key]: newValues
                                }
                              });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4">
              <Label>Unique Class</Label>
              <Input 
                value={squadronData["unique-class"].join(', ')}
                onChange={(e) => {
                  const uniqueClassString = e.target.value;
                  const uniqueClassArray = uniqueClassString
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t !== '');
                  setSquadronData({
                    ...squadronData,
                    "unique-class": uniqueClassArray
                  });
                }}
                placeholder="Enter unique classes, comma-separated"
              />
            </div>

            <div className="space-y-4">
              <Label>Special Ability Text</Label>
              <Input 
                value={squadronData.ability}
                onChange={(e) => setSquadronData({...squadronData, ability: e.target.value})}
                placeholder="Enter squadron ability text"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <ImageUpload onUpload={handleImageUpload} />
                {image && (
                  <div className="w-32 h-32 relative">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleSaveSquadron}
                variant="default"
              >
                Save Squadron
              </Button>
            </div>
          </div>
        </div>
      )}

      {contentType === "upgrade" && (
        <div className="mt-4 space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Upgrade Name</Label>
                <Input 
                  value={upgradeData.name}
                  onChange={(e) => setUpgradeData({...upgradeData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <Label>Upgrade Type</Label>
                <Select 
                  value={upgradeData.type}
                  onValueChange={(value) => setUpgradeData({...upgradeData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {upgradeTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/-/g, ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Points</Label>
                <Input 
                  type="number"
                  value={upgradeData.points}
                  onChange={(e) => setUpgradeData({...upgradeData, points: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-1">
                <Label>Faction</Label>
                <Select 
                  value={upgradeData.faction[0] || ""}
                  onValueChange={(value) => setUpgradeData({...upgradeData, faction: [value]})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {factionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Ability Text</Label>
              <Input 
                value={upgradeData.ability}
                onChange={(e) => setUpgradeData({...upgradeData, ability: e.target.value})}
                placeholder="Enter upgrade ability text"
              />
            </div>

            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={upgradeData.unique}
                  onCheckedChange={(checked) => setUpgradeData({...upgradeData, unique: checked})}
                  className="custom-switch"
                />
                <Label>Unique</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={upgradeData.modification}
                  onCheckedChange={(checked) => setUpgradeData({...upgradeData, modification: checked})}
                  className="custom-switch"
                />
                <Label>Modification</Label>
              </div>
            </div>

            {advancedMode && (
              <>
                <div className="space-y-4">
                  <Label>Restrictions</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Traits</Label>
                      <Input 
                        value={upgradeData.restrictions.traits.join(', ')}
                        onChange={(e) => {
                          const traitsArray = e.target.value.split(',').map(t => t.trim()).filter(t => t !== '');
                          setUpgradeData({
                            ...upgradeData,
                            restrictions: {
                              ...upgradeData.restrictions,
                              traits: traitsArray
                            }
                          });
                        }}
                        placeholder="Enter traits, comma-separated"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Size Restrictions</Label>
                      <Input 
                        value={upgradeData.restrictions.size.join(', ')}
                        onChange={(e) => {
                          const sizeArray = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                          setUpgradeData({
                            ...upgradeData,
                            restrictions: {
                              ...upgradeData.restrictions,
                              size: sizeArray
                            }
                          });
                        }}
                        placeholder="small, medium, large"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
              <Label>Unique Class</Label>
              <Input 
                value={upgradeData["unique-class"].join(', ')}
                onChange={(e) => {
                  const uniqueClassString = e.target.value;
                  const uniqueClassArray = uniqueClassString
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t !== '');
                  setUpgradeData({
                    ...upgradeData,
                    "unique-class": uniqueClassArray
                  });
                }}
                placeholder="Enter unique classes, comma-separated"
              />
            </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={upgradeData.restrictions.flagship}
                      onCheckedChange={(checked) => setUpgradeData({
                        ...upgradeData,
                        restrictions: {
                          ...upgradeData.restrictions,
                          flagship: checked
                        }
                      })}
                      className="custom-switch"
                    />
                    <Label>Flagship Only</Label>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <ImageUpload onUpload={handleImageUpload} />
                {image && (
                  <div className="w-32 h-32 relative">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleSaveUpgrade}
                variant="default"
              >
                Save Upgrade
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 