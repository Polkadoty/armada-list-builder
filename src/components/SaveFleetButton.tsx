import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';

interface SaveFleetButtonProps {
  fleetData: string;
  faction: string;
  fleetName: string;
}

export function SaveFleetButton({ fleetData, faction, fleetName }: SaveFleetButtonProps) {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveFleet = async () => {
    if (!user) {
      alert('Please sign in to save your fleet');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('fleets')
        .upsert({
          user_id: user.sub,
          fleet_data: fleetData,
          faction,
          fleet_name: fleetName,
        }, {
          onConflict: 'user_id,fleet_name',
        });

      if (error) throw error;

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
