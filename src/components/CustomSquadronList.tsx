import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { supabase } from '../lib/supabase';
import {
  Table,
  TableBody,
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingScreen } from "@/components/LoadingScreen";

interface CustomSquadron {
  id: string;
  name: string;
  faction: string;
  squadron_type: string;
  points: number;
  created_at: string;
  is_public: boolean;
  ace_name?: string;
}

export function CustomSquadronList() {
  const { user } = useUser();
  const [squadrons, setSquadrons] = useState<CustomSquadron[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [squadronToDelete, setSquadronToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchSquadrons();
  }, [user]);

  const fetchSquadrons = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_squadrons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSquadrons(data || []);
    } catch (error) {
      console.error('Error fetching squadrons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSquadron = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_squadrons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSquadrons(squadrons.filter(squadron => squadron.id !== id));
      setDeleteDialogOpen(false);
      setSquadronToDelete(null);
    } catch (error) {
      console.error('Error deleting squadron:', error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">Custom Squadrons</h2>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Faction</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Public</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {squadrons.map((squadron) => (
            <TableRow key={squadron.id}>
              <TableCell>
                {squadron.ace_name ? `${squadron.ace_name} (${squadron.name})` : squadron.name}
              </TableCell>
              <TableCell>{squadron.faction}</TableCell>
              <TableCell>{squadron.squadron_type}</TableCell>
              <TableCell>{squadron.points}</TableCell>
              <TableCell>{new Date(squadron.created_at).toLocaleDateString()}</TableCell>
              <TableCell>{squadron.is_public ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSquadronToDelete(squadron.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Squadron</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this squadron?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => squadronToDelete && handleDeleteSquadron(squadronToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 