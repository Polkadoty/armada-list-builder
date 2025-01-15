import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Card } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
// import { SquadronCardPreview } from './SquadronCardPreview';
// import { SquadronBasePreview } from './SquadronBasePreview';
import { supabase } from '@/lib/supabaseClient';
import { transformSquadronForDB } from '@/utils/squadronDataTransform';
import { ContentSource } from '@/components/FleetBuilder';

// TODO: Add ability to add squadron cards to fleet

interface SquadronBuilderProps {
  onBack: () => void;
  userId: string;
}

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Squadron Builder</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Squadron Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

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
            <Label htmlFor="hull">Hull Value</Label>
            <Input
              id="hull"
              type="number"
              value={formData.hull}
              onChange={(e) => setFormData({...formData, hull: parseInt(e.target.value)})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="speed">Speed</Label>
            <Input
              id="speed"
              type="number"
              value={formData.speed}
              onChange={(e) => setFormData({...formData, speed: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.unique}
              onCheckedChange={(checked) => setFormData({...formData, unique: checked})}
            />
            <Label>Unique</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.ace}
              onCheckedChange={(checked) => setFormData({...formData, ace: checked})}
            />
            <Label>Ace</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.irregular}
              onCheckedChange={(checked) => setFormData({...formData, irregular: checked})}
            />
            <Label>Irregular</Label>
          </div>
        </div>

        {/* TODO: Add remaining form fields for tokens, abilities, armament */}
        
        <Button type="submit" className="w-full">Create Squadron</Button>
      </form>
    </div>
  );
}