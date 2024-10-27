import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';
import { NotificationWindow } from '@/components/NotificationWindow';

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
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleSaveFleet = async () => {
    if (!user) {
      setNotificationMessage('Please sign in to save your fleet');
      setShowNotification(true);
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

      setNotificationMessage('Fleet saved successfully!');
      setShowNotification(true);
    } catch (error) {
      console.error('Error saving fleet:', error);
      setNotificationMessage('Failed to save fleet. Please try again.');
      setShowNotification(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleSaveFleet} 
        disabled={isSaving || !user}
        variant="outline"
      >
        <Save className="h-4 w-4" />
      </Button>
      {showNotification && (
        <NotificationWindow
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
}
