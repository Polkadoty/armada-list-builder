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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from 'next/link';
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
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm font-medium">Fleet List</button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Your Fleets</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
