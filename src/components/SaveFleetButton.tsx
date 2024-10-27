import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';

interface SaveFleetButtonProps {
    fleetData: string;
    faction: string;
    fleetName: string;
    commander: string;
    points: number;
}

export function SaveFleetButton({ fleetData, faction, fleetName, commander, points }: SaveFleetButtonProps) {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveFleet = async () => {
    if (!user) {
      alert('Please sign in to save your fleet');
      return;
    }

    setIsSaving(true);

    try {
      const { data } = await supabase
        .from('fleets')
        .select('id')
        .eq('user_id', user.sub)
        .eq('fleet_name', fleetName)
        .single();

      if (data) {
        // Update existing fleet
        const { error } = await supabase
          .from('fleets')
          .update({ fleet_data: fleetData, faction, commander, points })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Insert new fleet
        const { error } = await supabase
          .from('fleets')
          .insert({ 
            user_id: user.sub, 
            fleet_name: fleetName, 
            fleet_data: fleetData, 
            faction, 
            commander, 
            points 
          });
        if (error) throw error;
      }

      alert('Fleet saved successfully!');
    } catch (error) {
      console.error('Error saving fleet:', error);
      alert('Failed to save fleet. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button 
      onClick={handleSaveFleet} 
      disabled={isSaving || !user}
      variant="outline"
      size="sm"
    >
      <Save className="mr-2 h-4 w-4" />
      {isSaving ? 'Saving...' : 'Save Fleet'}
    </Button>
  );
}
