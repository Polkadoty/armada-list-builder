import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Download, X } from 'lucide-react';
import { SquadronCardPreview } from './SquadronCardPreview';
// import { SquadronBasePreview } from './SquadronBasePreview';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from '@/lib/supabase';
import { useUser } from '@auth0/nextjs-auth0/client';
// import { exportCardAsWebP } from '@/utils/cardExport';
import { ArtworkUploader, type ArtworkTransform } from './ArtworkUploader';
import html2canvas from 'html2canvas';
import Image from 'next/image';
import { ImageUploader } from './ImageUploader';

interface SquadronBuilderProps {
  onBack: () => void;
}

type DefenseTokenType = 'scatter' | 'evade' | 'brace';

interface DiceDisplay {
  total: number;
  colors: ('red' | 'blue' | 'black')[];
}

export function convertArmamentToDisplay(armament: [number, number, number]): DiceDisplay {
  const colors: ('red' | 'blue' | 'black')[] = [];
  const colorMap = ['red', 'blue', 'black'] as const;
  
  armament.forEach((count, index) => {
    for (let i = 0; i < count; i++) {
      colors.push(colorMap[index]);
    }
  });
  
  return {
    total: colors.length,
    colors
  };
}

export function convertDisplayToArmament(display: DiceDisplay): [number, number, number] {
  const result: [number, number, number] = [0, 0, 0];
  display.colors.forEach(color => {
    switch (color) {
      case 'red': result[0]++; break;
      case 'blue': result[1]++; break;
      case 'black': result[2]++; break;
    }
  });
  return result;
}

const ABILITY_TEXT_TEMPLATES = {
  adept: (value: number) => `:adept: **Adept ${value}.** *(While attacking, you may reroll up to ${value} die.)*`,
  'ai-battery': (value: number) => `:ai: **AI: Battery ${value}.** *(While attacking a ship, if you were activated by a :squad: command, you may add ${value} die to your attack pool of a color that is already in your attack pool.)*`,
  'ai-antisquadron': (value: number) => `:ai: **AI: Anti-Squadron ${value}.** *(While attacking a squadron, if you were activated by a :squad: command, you may add ${value} die to your attack pool of a color that is already in your attack pool.)*`,
  assault: () => `:assault: **Assault.** *(While attacking a ship, you may spend 1 die with a :hit: icon. If you do, the defender gains 1 raid token of your choice.)*`,
  bomber: () => `:bomber: **Bomber.** *(While attacking a ship, each of your :crit: icons adds 1 damage to the damage total and you can resolve a critical effect.)*`,
  cloak: () => `:cloak: **Cloak.** *(At the end of the Squadron Phase, you may move up to distance 1, even if you are engaged.)*`,
  counter: (value: number) => `:counter: **Counter ${value}.** *(After a squadron performs a non-**counter** attack against you, you may attack that squadron with an anti-squadron armament of ${value} blue dice, even if you are destroyed.)*`,
  dodge: (value: number) => `:dodge: **Dodge ${value}.** *(While you are defending against a squadron, during the Spend Defense Tokens step, you may choose ${value} die to be rerolled.)*`,
  escort: () => `:escort: **Escort.** *(Squadrons you are engaged with cannot attack squadrons that lack **escort** unless performing a **counter** attack.)*`,
  grit: () => `:grit: **Grit.** *(You are not prevented from moving while you are engaged by only 1 squadron.)*`,
  heavy: () => `:heavy: **Heavy.** *(You do not prevent engaged squadrons from attacking ships or moving.)*`,
  intel: () => `:intel: **Intel.** *(While a friendly squadron is at distance 1 of you, it has **grit**.)*`,
  relay: (value: number) => `:relay: **Relay ${value}.** *(When a friendly ship resolves a \`squad\` command, if you are in range to be activated, up to ${value} of the squadrons it activates can be at distance 1-3 of you.)*`,
  rogue: () => `:rogue: **Rogue.** *(You can move and attack during the Squadron Phase.)*`,
  scout: () => `:scout: **Scout.** *(While deploying fleets you may be placed outside of the deployment zone and don't have to be placed within distance 1-2 of a friendly ship. You must be placed beyond distance 1-5 of all enemy ships and enemy squadrons.)*`,
  screen: () => `:screen: **Screen.** *(While you are defending, for each other friendly squadron the attacker is engaged with that lacks **screen**, up to 3, you gain **dodge 1**.)*`,
  snipe: (value: number) => `:snipe: **Snipe ${value}.** *(You can attack squadrons at distance 2 with anti-squadron armament of ${value} blue dice. This attack ignores the **counter** keyword.)*`,
  strategic: () => `:strategic: **Strategic.** *(When you end your movement at distance 1 of 1 or more objective tokens, you may move 1 of those tokens so that it is at distance 1 of you.)*`,
  swarm: () => `:swarm: **Swarm.** *(While attacking a squadron engaged with another squadron, you may reroll 1 die.)*`,
};

const DICE_COLOR_STYLES = {
  red: "text-red-500",
  blue: "text-blue-500",
  black: "text-gray-300"
} as const;

// Helper function to ensure non-negative numbers
const ensureNonNegative = (value: string | number) => {
  const num = typeof value === 'string' ? parseInt(value) : value;
  return Math.max(0, num);
};

interface FormData {
  // Core squadron data
  name: string;
  faction: string;
  squadron_type: string;
  ace_name: string;
  unique_class: string[];
  irregular: boolean;
  
  // Stats
  hull: number;
  speed: number;
  points: number;
  
  // Complex data
  tokens: {
    def_scatter: number;
    def_evade: number;
    def_brace: number;
  };
  armament: {
    'anti-squadron': [number, number, number];
    'anti-ship': [number, number, number];
  };
  abilities: {
    adept: number;
    'ai-battery': number;
    'ai-antisquadron': number;
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
  
  // Additional attributes
  ability: string;
  is_unique: boolean;
  ace: boolean;
  
  // Image paths
  silhouette?: string;
  artwork?: string;
  cardimage: string;
  
  // Optional metadata
  author: string[];
  alias: string;
  team: string;
  release: string;
  expansion: string;
  type: string;
  nicknames: string[];
  artworkTransform?: ArtworkTransform;
  silhouetteTransform?: ArtworkTransform;
  import_alias: string;
  published: boolean;
  version: number;
  tags: string[];
}

export function SquadronBuilder({ onBack }: SquadronBuilderProps) {
  const { user } = useUser();
  const previewRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    // Core squadron data
    name: '',
    faction: 'empire',
    squadron_type: '',
    ace_name: '',  // Changed from 'ace-name' to match DB schema
    unique_class: [],
    irregular: false,
    
    // Stats
    hull: 3,
    speed: 3,
    points: 0,
    
    // Complex data
    tokens: {
      def_scatter: 0,
      def_evade: 0,
      def_brace: 0
    },
    armament: {
      'anti-squadron': [0, 0, 0] as [number, number, number],
      'anti-ship': [0, 0, 0] as [number, number, number]
    },
    abilities: {
      adept: 0,
      'ai-battery': 0,
      'ai-antisquadron': 0,
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
    
    // Additional attributes
    ability: '',
    is_unique: false,  // Changed from 'unique' to match DB schema
    ace: false,
    
    // Image paths
    silhouette: '',
    artwork: '',
    cardimage: '',
    
    // Optional metadata
    author: [],
    alias: '',
    team: '',
    release: '',
    expansion: '',
    type: 'squadron',
    nicknames: [],
    artworkTransform: undefined,
    silhouetteTransform: undefined,
    import_alias: '',
    published: false,
    version: 1,
    tags: [],
  });

  // Add independent state for the two defense token drop-downs.
  const [defenseToken1, setDefenseToken1] = useState<DefenseTokenType>('brace');
  const [defenseToken2, setDefenseToken2] = useState<DefenseTokenType>('evade');

  // Add a new state for total defense tokens
  const [totalDefenseTokens, setTotalDefenseTokens] = useState(0);

  // Add new state for italics
  const [nameItalics, setNameItalics] = useState(false);
  const [aceNameItalics, setAceNameItalics] = useState(false);

  // When either drop-down changes, update the tokens object (which is used for JSON output).
  useEffect(() => {
    const tokens = {
      def_scatter: 0,
      def_evade: 0,
      def_brace: 0,
    };
    
    if (totalDefenseTokens >= 1) {
      tokens[`def_${defenseToken1}`] += 1;
    }
    
    if (totalDefenseTokens === 2) {
      tokens[`def_${defenseToken2}`] += 1;
    }
    
    setFormData((prev) => ({ ...prev, tokens }));
  }, [defenseToken1, defenseToken2, totalDefenseTokens]);

  const generateCardImage = async (): Promise<string | null> => {
    if (!previewRef.current) return null;
    
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      width: 1271,
      height: 1750,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
    });
    
    return canvas.toDataURL('image/webp', 0.9);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Generate card image
      const cardImageData = await generateCardImage();
      if (!cardImageData) throw new Error('Failed to generate card image');

      // Upload card image to Supabase storage
      const cardImagePath = `squadrons/${user.sub}/${Date.now()}-card.webp`;
      const { error: uploadError } = await supabase.storage
        .from('custom-content')
        .upload(cardImagePath, base64ToBlob(cardImageData), {
          contentType: 'image/webp'
        });

      if (uploadError) throw uploadError;

      // Get public URL for card image
      const { data: { publicUrl: cardImageUrl } } = supabase.storage
        .from('custom-content')
        .getPublicUrl(cardImagePath);

      // Save squadron data
      const { error: dbError } = await supabase
        .from('custom_squadrons')
        .insert({
          ...formData,
          user_id: user.sub,
          cardimage: cardImageUrl,
          artwork: formData.artwork || null,
          import_alias: `squadron-${Date.now()}`,
          is_public: true,
        });

      if (dbError) throw dbError;

      // Success! Go back to workshop
      onBack();
    } catch (error) {
      console.error('Error saving squadron:', error);
      // Add error handling UI here
    }
  };

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string): Blob => {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
  };

  const updateAbilityText = (ability: string, value: boolean | number) => {
    const template = ABILITY_TEXT_TEMPLATES[ability as keyof typeof ABILITY_TEXT_TEMPLATES];
    if (!template) return;

    // Split existing text into lines and filter out the line containing this ability
    const lines = formData.ability.split('\n').filter(line => !line.includes(`\`${ability}\``));
    
    // Only add new text if the value is truthy
    if (value) {
      if (typeof value === 'number') {
        lines.push(template(value));
      } else if (value === true) {
        lines.push(template(0));
      }
    }

    setFormData({ ...formData, ability: lines.join('\n').trim() });
  };

  const renderDiceLabel = (color: keyof typeof DICE_COLOR_STYLES) => (
    <Label className={`text-xs ${DICE_COLOR_STYLES[color]}`}>
      {color.charAt(0).toUpperCase() + color.slice(1)}
    </Label>
  );

  const handleDownload = async () => {
    if (!hiddenRef.current) return;

    try {
      const canvas = await html2canvas(hiddenRef.current.querySelector('[data-export-preview]')!, {
        width: 1271,
        height: 1780,
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowHeight: 1780,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${formData.name.toLowerCase().replace(/\s+/g, '-')}-squadron-card.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error('Error generating card image:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 lg:mr-[432px]">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Squadron Builder</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="faction">Faction</Label>
              <Select 
                value={formData.faction}
                onValueChange={(value) => setFormData({...formData, faction: value})}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select faction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empire">Empire</SelectItem>
                  <SelectItem value="rebel">Rebels</SelectItem>
                  <SelectItem value="republic">Republic</SelectItem>
                  <SelectItem value="separatist">Separatists</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({...formData, points: ensureNonNegative(e.target.value)})}
                className="w-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed">Speed</Label>
              <Input
                id="speed"
                type="number"
                min="0"
                value={formData.speed}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setFormData({...formData, speed: isNaN(value) ? 0 : ensureNonNegative(value)})
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hull">Hull</Label>
              <Input
                id="hull"
                type="number"
                min="0"
                value={formData.hull}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setFormData({...formData, hull: isNaN(value) ? 0 : ensureNonNegative(value)})
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_unique"
                checked={formData.is_unique}
                onChange={(e) => setFormData({...formData, is_unique: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <Label htmlFor="is_unique">Unique</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ace"
                checked={formData.ace}
                onChange={(e) => setFormData({...formData, ace: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <Label htmlFor="ace">Ace</Label>
            </div>
          </div>

          {(
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="text-red-500">Squadron Chassis Name *</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={nameItalics ? "italic" : "normal"}
                    onValueChange={(value) => setNameItalics(value === "italic")}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="italic">Italic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="border-red-500"
              />
              {formData.is_unique && (
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="include_chassis"
                    checked={formData.unique_class.includes(formData.name)}
                    onChange={(e) => {
                      const newUniqueClass = e.target.checked 
                        ? [...formData.unique_class, formData.name]
                        : formData.unique_class.filter(uc => uc !== formData.name);
                      setFormData({...formData, unique_class: newUniqueClass});
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <Label htmlFor="include_chassis">Include in unique class exclusions</Label>
                </div>
              )}
            </div>
          )}

          {formData.is_unique && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ace_name">Squadron Ace Name</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={aceNameItalics ? "italic" : "normal"}
                    onValueChange={(value) => setAceNameItalics(value === "italic")}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="italic">Italic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Input
                id="ace_name"
                value={formData.ace_name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({
                    ...formData, 
                    ace_name: newName,
                    unique_class: [
                      ...formData.unique_class.filter(uc => uc !== formData.ace_name),
                      newName
                    ].filter(Boolean)
                  });
                }}
              />
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Squadron Armament</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Anti-Squadron</Label>
              <div className="space-y-4">
                <div>
                  <Label>Total Dice</Label>
                  <Select 
                    value={convertArmamentToDisplay(formData.armament['anti-squadron']).total.toString()}
                    onValueChange={(value) => {
                      const newTotal = parseInt(value);
                      const currentDisplay = convertArmamentToDisplay(formData.armament['anti-squadron']);
                      const newColors = currentDisplay.colors.slice(0, newTotal);
                      while (newColors.length < newTotal) {
                        newColors.push('blue');
                      }
                      
                      setFormData({
                        ...formData,
                        armament: {
                          ...formData.armament,
                          'anti-squadron': convertDisplayToArmament({ total: newTotal, colors: newColors })
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 Dice</SelectItem>
                      <SelectItem value="1">1 Die</SelectItem>
                      <SelectItem value="2">2 Dice</SelectItem>
                      <SelectItem value="3">3 Dice</SelectItem>
                      <SelectItem value="4">4 Dice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {convertArmamentToDisplay(formData.armament['anti-squadron']).total > 0 && (
                  <div className="space-y-2">
                    <Label>Dice Colors</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: convertArmamentToDisplay(formData.armament['anti-squadron']).total }).map((_, index) => (
                        <Select
                          key={index}
                          value={convertArmamentToDisplay(formData.armament['anti-squadron']).colors[index]}
                          onValueChange={(color: 'red' | 'blue' | 'black') => {
                            const currentDisplay = convertArmamentToDisplay(formData.armament['anti-squadron']);
                            const newColors = [...currentDisplay.colors];
                            newColors[index] = color;
                            
                            setFormData({
                              ...formData,
                              armament: {
                                ...formData.armament,
                                'anti-squadron': convertDisplayToArmament({ total: currentDisplay.total, colors: newColors })
                              }
                            });
                          }}
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="red" className="text-red-500">Red</SelectItem>
                            <SelectItem value="blue" className="text-blue-500">Blue</SelectItem>
                            <SelectItem value="black" className="text-gray-300">Black</SelectItem>
                          </SelectContent>
                        </Select>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Anti-Ship</Label>
              <div className="space-y-4">
                <div>
                  <Label>Total Dice</Label>
                  <Select 
                    value={convertArmamentToDisplay(formData.armament['anti-ship']).total.toString()}
                    onValueChange={(value) => {
                      const newTotal = parseInt(value);
                      const currentDisplay = convertArmamentToDisplay(formData.armament['anti-ship']);
                      const newColors = currentDisplay.colors.slice(0, newTotal);
                      while (newColors.length < newTotal) {
                        newColors.push('blue');
                      }
                      
                      setFormData({
                        ...formData,
                        armament: {
                          ...formData.armament,
                          'anti-ship': convertDisplayToArmament({ total: newTotal, colors: newColors })
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 Dice</SelectItem>
                      <SelectItem value="1">1 Die</SelectItem>
                      <SelectItem value="2">2 Dice</SelectItem>
                      <SelectItem value="3">3 Dice</SelectItem>
                      <SelectItem value="4">4 Dice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {convertArmamentToDisplay(formData.armament['anti-ship']).total > 0 && (
                  <div className="space-y-2">
                    <Label>Dice Colors</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: convertArmamentToDisplay(formData.armament['anti-ship']).total }).map((_, index) => (
                        <Select
                          key={index}
                          value={convertArmamentToDisplay(formData.armament['anti-ship']).colors[index]}
                          onValueChange={(color: 'red' | 'blue' | 'black') => {
                            const currentDisplay = convertArmamentToDisplay(formData.armament['anti-ship']);
                            const newColors = [...currentDisplay.colors];
                            newColors[index] = color;
                            
                            setFormData({
                              ...formData,
                              armament: {
                                ...formData.armament,
                                'anti-ship': convertDisplayToArmament({ total: currentDisplay.total, colors: newColors })
                              }
                            });
                          }}
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="red" className="text-red-500">Red</SelectItem>
                            <SelectItem value="blue" className="text-blue-500">Blue</SelectItem>
                            <SelectItem value="black" className="text-gray-300">Black</SelectItem>
                          </SelectContent>
                        </Select>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {formData.is_unique && formData.ace && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Defense Tokens</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Defense Tokens</Label>
                <div className="w-[150px]">
                  <Select 
                    value={totalDefenseTokens.toString()}
                    onValueChange={(value: string) => {
                      const newTotal = parseInt(value);
                      setTotalDefenseTokens(newTotal);
                      
                      // Reset token selections if reducing total
                      if (newTotal === 0) {
                        setDefenseToken1('brace');
                        setDefenseToken2('evade');
                      } else if (newTotal === 1) {
                        setDefenseToken2('evade');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 Tokens</SelectItem>
                      <SelectItem value="1">1 Token</SelectItem>
                      <SelectItem value="2">2 Tokens</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {totalDefenseTokens >= 1 && (
                <div className="space-y-2">
                  <Label>First Defense Token</Label>
                  <Select 
                    value={defenseToken1}
                    onValueChange={(value: string) => setDefenseToken1(value as DefenseTokenType)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scatter">Scatter</SelectItem>
                      <SelectItem value="evade">Evade</SelectItem>
                      <SelectItem value="brace">Brace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {totalDefenseTokens === 2 && (
                <div className="space-y-2">
                  <Label>Second Defense Token</Label>
                  <Select 
                    value={defenseToken2}
                    onValueChange={(value: string) => setDefenseToken2(value as DefenseTokenType)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scatter">Scatter</SelectItem>
                      <SelectItem value="evade">Evade</SelectItem>
                      <SelectItem value="brace">Brace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Keywords & Abilities</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-amber-500 border-amber-500 hover:bg-amber-500/10">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Keyword
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-800 border border-gray-700">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 space-y-2">
                    {Object.entries(formData.abilities).map(([ability, value]) => {
                      const formattedAbility = ability
                        .split('-')
                        .map(word => {
                          if (word.toLowerCase() === 'ai') return 'AI';
                          return word.charAt(0).toUpperCase() + word.slice(1);
                        })
                        .join(' ');

                      return (
                        <div key={ability} className="flex items-center justify-between">
                          <Label className="text-sm text-gray-200">{formattedAbility}</Label>
                          {typeof value === 'boolean' ? (
                            <Switch
                              checked={formData.abilities[ability as keyof typeof formData.abilities] as boolean}
                              onCheckedChange={(checked) => {
                                setFormData({
                                  ...formData,
                                  abilities: { ...formData.abilities, [ability]: checked }
                                });
                                updateAbilityText(ability, checked);
                              }}
                            />
                          ) : (
                            <Input
                              type="number"
                              min="0"
                              value={String(formData.abilities[ability as keyof typeof formData.abilities])}
                              onChange={(e) => {
                                const newValue = ensureNonNegative(e.target.value);
                                setFormData({
                                  ...formData,
                                  abilities: { ...formData.abilities, [ability]: newValue }
                                });
                                updateAbilityText(ability, newValue);
                              }}
                              className="w-20 h-8 text-sm bg-gray-700"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <Label htmlFor="ability" className="text-gray-200 mb-2 block">Card Ability Text</Label>
          <textarea
            id="ability"
            className="w-full min-h-[150px] p-4 rounded-md bg-gray-700 border-gray-600 text-gray-100 resize-none"
            value={formData.ability}
            onChange={(e) => setFormData({...formData, ability: e.target.value})}
          />
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-4 w-full">
            <h3 className="text-lg font-semibold">Squadron Artwork</h3>
            <div className="flex justify-center w-full">
              <ImageUploader
                onImageChange={(image, transform) => {
                  setFormData({
                    ...formData,
                    artwork: image,
                    artworkTransform: transform
                  });
                }}
                initialImage={formData.artwork}
                aspectRatio="2.5/3.5"
                previewSize="lg"
                allowTransform
              />
            </div>
          </div>

          <div className="space-y-4 w-full">
            <h3 className="text-lg font-semibold">Squadron Silhouette</h3>
            <div className="flex justify-center w-full">
              <ImageUploader
                onImageChange={(image, transform) => {
                  setFormData({
                    ...formData,
                    silhouette: image,
                    silhouetteTransform: transform
                  });
                }}
                initialImage={formData.silhouette}
                initialTransform={{
                  x: 51, // 4% from left
                  y: -88, // -7.7% from bottom
                  scale: 1,
                  rotation: 0,
                  flipped: false,
                  brightness: 100,
                  contrast: 100,
                  opacity: 100
                }}
                previewSize="sm"
                allowTransform={true}
                label={
                  <div className="space-y-1.5 text-sm">
                    <p className="text-gray-300">Upload silhouette</p>
                    <p className="text-xs text-gray-500">(transparent PNG recommended)</p>
                  </div>
                }
                aspectRatio="1/1"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleDownload}
          className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Squadron Card
        </Button>
      </form>

      <div className="lg:fixed lg:top-24 lg:right-6 lg:w-[400px] w-full mt-6 lg:mt-0">
        <div className="sticky top-24">
          {/* Visible preview */}
          <div ref={previewRef} className="relative">
            <div 
              className="squadron-card-preview relative w-[400px] bg-black/50 rounded-lg overflow-hidden"
              style={{
                transform: 'scale(1)', // Scale down 1271px to fit in 400px container
              }}
            >
              <SquadronCardPreview formData={{
                ...formData,
                unique: formData.is_unique,
                nameItalics,
                aceNameItalics,
              }} />
            </div>
          </div>

          {/* Hidden export preview */}
          <div 
            ref={hiddenRef}
            className="absolute opacity-0 pointer-events-none"
            style={{
              top: 0,
              left: '-9999px',
            }}
          >
            <div 
              className="squadron-card-preview relative w-[1271px] h-[1780px] bg-black/50 rounded-lg overflow-hidden"
              style={{
                transform: 'scale(3.1775)', // Scale down 1271px to fit in 400px container
                transformOrigin: 'top left'
              }}
              data-export-preview
            >
              <SquadronCardPreview 
                formData={{
                  ...formData,
                  unique: formData.is_unique,
                  nameItalics,
                  aceNameItalics,
                }}
                exportMode
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}