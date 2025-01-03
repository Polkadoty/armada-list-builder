import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { LoadingScreen } from '../../../components/LoadingScreen';

export default function SharedFleetPage() {
  const router = useRouter();
  const { fleetId } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSharedFleet() {
      if (!fleetId) return;

      try {
        const { data, error } = await supabase
          .from('fleets')
          .select('*')
          .eq('numerical_id', fleetId)
          .eq('shared', true)
          .single();

        if (error) throw error;
        
        if (!data) {
          setError('Fleet not found or not shared');
          setIsLoading(false);
          return;
        }

        // Save fleet data and redirect to faction page
        localStorage.setItem(`savedFleet_${data.faction}`, data.fleet_data);
        document.cookie = "retrieved-from-list=true; path=/";
        
        router.push(`/${data.faction}`);
      } catch (error) {
        console.error('Error loading shared fleet:', error);
        setError('Error loading fleet');
        setIsLoading(false);
      }
    }

    loadSharedFleet();
  }, [fleetId, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen progress={50} message="Loading shared fleet..." />;
  }

  return null;
}