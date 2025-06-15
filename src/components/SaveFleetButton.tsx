import { useState, forwardRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';
import { NotificationWindow } from '@/components/NotificationWindow';
import { getContentTypes } from './FleetList';
import { FleetNamePrompt } from './FleetNamePrompt';

interface SaveFleetButtonProps {
    fleetData: string;
    faction: string;
    fleetName: string;
    setFleetName: (name: string) => void;
    commander: string;
    points: number;
}

export const SaveFleetButton = forwardRef<HTMLButtonElement, SaveFleetButtonProps>(
  ({ fleetData, faction, fleetName, setFleetName, commander, points }, ref) => {
    const { user } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [showNamePrompt, setShowNamePrompt] = useState(false);

    const handleButtonClick = () => {
      if (!user) {
        setNotificationMessage('Please sign in to save your fleet');
        setShowNotification(true);
        return;
      }

      // Check if fleet name is "Untitled Fleet" and prompt for rename
      if (fleetName === 'Untitled Fleet') {
        setShowNamePrompt(true);
        return;
      }

      performSave(fleetName);
    };

    const performSave = async (nameToUse: string) => {
      if (!user) return;
      
      setIsSaving(true);

      try {
        const contentTypes = getContentTypes(fleetData);
        const { data } = await supabase
          .from('fleets')
          .select('id')
          .eq('user_id', user.sub)
          .eq('fleet_name', nameToUse)
          .single();

        if (data) {
          // Update existing fleet
          const { error } = await supabase
            .from('fleets')
            .update({ 
              fleet_data: fleetData, 
              faction, 
              commander, 
              points,
              legends: contentTypes.legends,
              legacy: contentTypes.legacy,
              legacy_beta: contentTypes.legacy_beta,
              arc: contentTypes.arc,
              nexus: contentTypes.nexus
            })
            .eq('id', data.id);
          if (error) throw error;
        } else {
          // Insert new fleet
          const { error } = await supabase
            .from('fleets')
            .insert({ 
              user_id: user.sub,
              fleet_name: nameToUse,
              fleet_data: fleetData,
              faction,
              commander,
              points,
              legends: contentTypes.legends,
              legacy: contentTypes.legacy,
              legacy_beta: contentTypes.legacy_beta,
              arc: contentTypes.arc,
              nexus: contentTypes.nexus
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

    const handleNameConfirm = (newName: string) => {
      setFleetName(newName);
      setShowNamePrompt(false);
      performSave(newName);
    };

    const handleNameCancel = () => {
      setShowNamePrompt(false);
    };

    return (
      <>
        <Button 
          ref={ref}
          onClick={handleButtonClick} 
          disabled={isSaving || !user}
          variant="outline"
          className="bg-white/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md"
        >
          <Save className="h-4 w-4" />
        </Button>
        {showNotification && (
          <NotificationWindow
            message={notificationMessage}
            onClose={() => setShowNotification(false)}
          />
        )}
        {showNamePrompt && (
          <FleetNamePrompt
            currentName={fleetName}
            onConfirm={handleNameConfirm}
            onCancel={handleNameCancel}
            action="save"
          />
        )}
      </>
    );
  }
);

SaveFleetButton.displayName = 'SaveFleetButton';
