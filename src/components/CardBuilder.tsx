import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { ImageUpload } from "@/components/ImageUpload";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { v4 as uuidv4 } from 'uuid';
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { useUser } from "@auth0/nextjs-auth0/client";
import { imageDb } from "@/lib/imageDb";

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

const upgradeTypes = [
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
  const [modelKey] = useState<string>('');
  const [advancedMode, setAdvancedMode] = useState(false);

  const factionOptions = [
    { label: "Empire", value: "empire" },
    { label: "Rebel", value: "rebel" },
    { label: "Republic", value: "republic" },
    { label: "Separatist", value: "separatist" }
  ];

  const handleImageUpload = async (file: File) => {
    try {
      setImage(file);
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const imageKey = `ship_${Date.now()}_${file.name}`;
        
        await imageDb.saveImage(imageKey, base64String);
        setCurrentModel(prev => ({...prev, cardimage: imageKey}));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleSaveShip = () => {
    const shipId = uuidv4();
    const modelId = uuidv4();
    const customShips = JSON.parse(localStorage.getItem("customShips") || "{ \"ships\": {} }");
    
    const updatedModel = {
      ...currentModel,
      _id: modelId,
      chassis: shipData.chassis_name,
      author: user?.email || "anonymous",
      cardimage: image ? image.name : ""
    };

    if (modelKey) {
      shipData.models[modelKey] = updatedModel;
    }

    customShips.ships[shipId] = {
      ...shipData,
      _id: shipId
    };

    localStorage.setItem("customShips", JSON.stringify(customShips));
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
    const newUpgrades = [...currentModel.upgrades];
    
    // Always add title if not present
    if (!newUpgrades.includes('title')) {
      newUpgrades.push('title');
    }
    
    // Add commander if not flotilla and not present
    if (!currentModel.traits.includes('flotilla') && !newUpgrades.includes('commander')) {
      newUpgrades.push('commander');
    }
    
    // Remove commander if flotilla
    if (currentModel.traits.includes('flotilla')) {
      const commanderIndex = newUpgrades.indexOf('commander');
      if (commanderIndex !== -1) {
        newUpgrades.splice(commanderIndex, 1);
      }
    }
    
    // Calculate weapons-team-offensive-retro slots
    const weaponsTeamCount = newUpgrades.filter(u => u === 'weapons-team').length;
    const offensiveRetroCount = newUpgrades.filter(u => u === 'offensive-retro').length;
    const possibleCombos = Math.min(weaponsTeamCount, offensiveRetroCount);
    
    // Remove all existing weapons-team-offensive-retro
    let newUpgradesArray = [...newUpgrades];
    newUpgradesArray = newUpgradesArray.filter(u => u !== 'weapons-team-offensive-retro');
    
    // Add the calculated number of weapons-team-offensive-retro
    for (let i = 0; i < possibleCombos; i++) {
      newUpgradesArray.push('weapons-team-offensive-retro');
    }
    
    setCurrentModel(prev => ({...prev, upgrades: newUpgradesArray}));
  }, [currentModel.traits, currentModel.upgrades]);

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
            <TabsTrigger value="squadron" disabled className="opacity-50">
              Squadron
            </TabsTrigger>
            <TabsTrigger value="upgrade" disabled className="opacity-50">
              Upgrade
            </TabsTrigger>
            <TabsTrigger value="objective" disabled className="opacity-50">
              Objective
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center space-x-2">
          <Switch
            checked={advancedMode}
            onCheckedChange={setAdvancedMode}
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
                  onChange={(e) => setCurrentModel({
                    ...currentModel,
                    traits: e.target.value.split(',').map(t => t.trim()).filter(t => t !== '')
                  })}
                  placeholder="Enter traits, comma-separated"
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
                  {upgradeTypes
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
    </Card>
  );
} 