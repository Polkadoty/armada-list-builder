import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus } from 'lucide-react';
// import { SquadronCardPreview } from './SquadronCardPreview';
// import { SquadronBasePreview } from './SquadronBasePreview';
import { supabase } from '@/lib/supabaseClient';
import { transformSquadronForDB } from '@/utils/squadronDataTransform';
import { ContentSource } from '@/components/FleetBuilder';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

// TODO: Add ability to add squadron cards to fleet

interface SquadronBuilderProps {
  onBack: () => void;
  userId: string;
}

const ABILITY_TEXT_TEMPLATES = {
  adept: (value: number) => `\`adept\` **Adept ${value}.** *(While attacking, you may reroll up to ${value} die.)*`,
  'ai-battery': (value: number) => `\`ai\` **AI: Battery ${value}.** *(While attacking a ship, if you were activated by a \`squad\` command, you may add ${value} die to your attack pool of a color that is already in your attack pool.)*`,
  'ai-antisquadron': (value: number) => `\`ai\` **AI: Anti-Squadron ${value}.** *(While attacking a squadron, if you were activated by a \`squad\` command, you may add ${value} die to your attack pool of a color that is already in your attack pool.)*`,
  assault: () => `\`assault\` **Assault.** *(While attacking a ship, you may spend 1 die with a \`hit\` icon. If you do, the defender gains 1 raid token of your choice.)*`,
  bomber: () => `\`bomber\` **Bomber.** *(While attacking a ship, each of your \`crit\` icons adds 1 damage to the damage total and you can resolve a critical effect.)*`,
  cloak: () => `\`cloak\` **Cloak.** *(At the end of the Squadron Phase, you may move up to distance 1, even if you are engaged.)*`,
  counter: (value: number) => `\`counter\` **Counter ${value}.** *(After a squadron performs a non-**counter** attack against you, you may attack that squadron with an anti-squadron armament of ${value} blue dice, even if you are destroyed.)*`,
  dodge: (value: number) => `\`dodge\` **Dodge ${value}.** *(While you are defending against a squadron, during the Spend Defense Tokens step, you may choose ${value} die to be rerolled.)*`,
  escort: () => `\`escort\` **Escort.** *(Squadrons you are engaged with cannot attack squadrons that lack **escort** unless performing a **counter** attack.)*`,
  grit: () => `\`grit\` **Grit.** *(You are not prevented from moving while you are engaged by only 1 squadron.)*`,
  heavy: () => `\`heavy\` **Heavy.** *(You do not prevent engaged squadrons from attacking ships or moving.)*`,
  intel: () => `\`intel\` **Intel.** *(While a friendly squadron is at distance 1 of you, it has **grit**.)*`,
  relay: (value: number) => `\`relay\` **Relay ${value}.** *(When a friendly ship resolves a \`squad\` command, if you are in range to be activated, up to ${value} of the squadrons it activates can be at distance 1-3 of you.)*`,
  rogue: () => `\`rogue\` **Rogue.** *(You can move and attack during the Squadron Phase.)*`,
  screen: () => `\`screen\` **Screen.** *(While you are defending, for each other friendly squadron the attacker is engaged with that lacks **screen**, up to 3, you gain **dodge 1**.)*`,
  snipe: (value: number) => `\`snipe\` **Snipe ${value}.** *(You can attack squadrons at distance 2 with anti-squadron armament of ${value} blue dice. This attack ignores the **counter** keyword.)*`,
  strategic: () => `\`strategic\` **Strategic.** *(When you end your movement at distance 1 of 1 or more objective tokens, you may move 1 of those tokens so that it is at distance 1 of you.)*`,
  swarm: () => `\`swarm\` **Swarm.** *(While attacking a squadron engaged with another squadron, you may reroll 1 die.)*`,
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

export function SquadronBuilder({ onBack, userId }: SquadronBuilderProps) {
  const [formData, setFormData] = useState({
    name: '',
    faction: 'empire',
    'ace-name': '',
    squadron_type: '',
    hull: 3,
    speed: 3,
    points: 0,
    unique: false,
    ace: false,
    irregular: false,
    tokens: {
      def_scatter: 0,
      def_evade: 0,
      def_brace: 0
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
    armament: {
      'anti-squadron': [0, 0, 0] as [number, number, number],
      'anti-ship': [0, 0, 0] as [number, number, number]
    },
    unique_class: [] as string[],
    ability: '',
    cardimage: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dbData = transformSquadronForDB(formData);
      
      const { data, error } = await supabase
        .from('custom_squadrons')
        .insert({
          ...dbData,
          user_id: userId,
          is_public: true // Add UI toggle for this later
        })
        .select()
        .single();

      if (error) throw error;
      
      // Success! Go back or show success message
      onBack();
    } catch (error) {
      console.error('Error saving squadron:', error);
      // Show error message to user
    }
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

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900">
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
                <SelectTrigger>
                  <SelectValue placeholder="Select faction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empire">Empire</SelectItem>
                  <SelectItem value="rebels">Rebels</SelectItem>
                  <SelectItem value="republic">Republic</SelectItem>
                  <SelectItem value="separatists">Separatists</SelectItem>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="speed">Speed</Label>
              <Input
                id="speed"
                type="number"
                min="0"
                value={formData.speed}
                onChange={(e) => setFormData({...formData, speed: ensureNonNegative(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hull">Hull</Label>
              <Input
                id="hull"
                type="number"
                min="0"
                value={formData.hull}
                onChange={(e) => setFormData({...formData, hull: ensureNonNegative(e.target.value)})}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ace-name">Squadron Ace Name (if any)</Label>
            <Input
              id="ace-name"
              value={formData['ace-name']}
              onChange={(e) => setFormData({...formData, 'ace-name': e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-red-500">Squadron Chassis Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border-red-500"
            />
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Squadron Armament</h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Anti-Squadron</Label>
              <div className="grid grid-cols-3 gap-4">
                {['red', 'blue', 'black'].map((color, index) => (
                  <div key={`anti-squadron-${color}`} className="space-y-1">
                    {renderDiceLabel(color as keyof typeof DICE_COLOR_STYLES)}
                    <Input
                      type="number"
                      min="0"
                      value={formData.armament['anti-squadron'][index]}
                      onChange={(e) => {
                        const newArmament = [...formData.armament['anti-squadron']];
                        newArmament[index] = ensureNonNegative(e.target.value);
                        setFormData({
                          ...formData,
                          armament: {
                            ...formData.armament,
                            'anti-squadron': newArmament as [number, number, number]
                          }
                        });
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">Anti-Ship</Label>
              <div className="grid grid-cols-3 gap-4">
                {['red', 'blue', 'black'].map((color, index) => (
                  <div key={`anti-ship-${color}`} className="space-y-1">
                    {renderDiceLabel(color as keyof typeof DICE_COLOR_STYLES)}
                    <Input
                      type="number"
                      value={formData.armament['anti-ship'][index]}
                      onChange={(e) => {
                        const newArmament = [...formData.armament['anti-ship']];
                        newArmament[index] = parseInt(e.target.value);
                        setFormData({
                          ...formData,
                          armament: {
                            ...formData.armament,
                            'anti-ship': newArmament as [number, number, number]
                          }
                        });
                      }}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Defense Tokens</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'def_scatter', label: 'Scatter' },
              { key: 'def_evade', label: 'Evade' },
              { key: 'def_brace', label: 'Brace' }
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-sm">{label}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.tokens[key as keyof typeof formData.tokens]}
                  onChange={(e) => setFormData({
                    ...formData,
                    tokens: {
                      ...formData.tokens,
                      [key]: ensureNonNegative(e.target.value)
                    }
                  })}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

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

        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900">
          Create Squadron
        </Button>
      </form>
    </div>
  );
}