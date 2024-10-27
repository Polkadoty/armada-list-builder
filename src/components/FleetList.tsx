import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { supabase } from '../lib/supabase';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useRouter } from 'next/router';

interface Fleet {
  id: string;
  fleet_name: string;
  faction: string;
  commander: string;
  points: number;
  date_added: string;
  fleet_data: string;
}

export function FleetList() {
  const { user } = useUser();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchFleets();
    }
  }, [user]);

  const fetchFleets = async () => {
    const { data, error } = await supabase
      .from('fleets')
      .select('*')
      .eq('user_id', user?.sub)
      .order('date_added', { ascending: false });

    if (error) {
      console.error('Error fetching fleets:', error);
    } else {
      setFleets(data || []);
    }
  };

  const handleFleetSelect = (fleet: Fleet) => {
    // Set cookie
    document.cookie = "retrieved-from-list=true; path=/";
    
    // Save fleet data to localStorage
    localStorage.setItem(`savedFleet_${fleet.faction}`, fleet.fleet_data);
    
    // Navigate to the faction page
    router.push(`/${fleet.faction}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Fleets</h2>
        </div>
        <div className="p-4">
          <Table>
            <TableCaption>A list of your saved fleets.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Fleet Name</TableHead>
                <TableHead>Faction</TableHead>
                <TableHead>Commander</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Date Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleets.map((fleet) => (
                <TableRow key={fleet.id}>
                  <TableCell>
                    <button
                      onClick={() => handleFleetSelect(fleet)}
                      className="text-blue-500 hover:underline"
                    >
                      {fleet.fleet_name}
                    </button>
                  </TableCell>
                  <TableCell>{fleet.faction}</TableCell>
                  <TableCell>{fleet.commander}</TableCell>
                  <TableCell>{fleet.points}</TableCell>
                  <TableCell>{new Date(fleet.date_added).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
