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
} from "@/components/ui/dialog";
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationWindow } from "@/components/NotificationWindow";

interface Fleet {
  id: string;
  fleet_name: string;
  faction: string;
  commander: string;
  points: number;
  date_added: string;
  fleet_data: string;
}

interface SortableColumn {
  id: keyof Fleet;
  label: string;
  sortable: boolean;
  visible: boolean;
}

const columns: SortableColumn[] = [
  { id: 'fleet_name', label: 'Fleet Name', sortable: true, visible: true },
  { id: 'faction', label: 'Faction', sortable: true, visible: true },
  { id: 'commander', label: 'Commander', sortable: true, visible: true },
  { id: 'points', label: 'Points', sortable: true, visible: true },
  { id: 'date_added', label: 'Date Added', sortable: true, visible: false },
];

export function FleetList() {
  const { user } = useUser();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Fleet>('date_added');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [factionFilter, setFactionFilter] = useState<string[]>([]);
  const [commanderFilter, setCommanderFilter] = useState<string[]>([]);
  const router = useRouter();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [fleetToDelete, setFleetToDelete] = useState<Fleet | null>(null);

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
    document.cookie = "retrieved-from-list=true; path=/";
    localStorage.setItem(`savedFleet_${fleet.faction}`, fleet.fleet_data);
    router.push(`/${fleet.faction}`);
  };

  const handleSort = (column: keyof Fleet) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const filteredFleets = fleets
    .filter(fleet => {
      const matchesSearch = fleet.fleet_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFaction = factionFilter.length === 0 || factionFilter.includes(fleet.faction);
      const matchesCommander = commanderFilter.length === 0 || commanderFilter.includes(fleet.commander);
      return matchesSearch && matchesFaction && matchesCommander;
    })
    .sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return aValue > bValue ? direction : -direction;
    });

  const totalPages = Math.ceil(filteredFleets.length / rowsPerPage);
  const paginatedFleets = filteredFleets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const uniqueFactions = Array.from(new Set(fleets.map(fleet => fleet.faction)));
  const uniqueCommanders = Array.from(new Set(fleets.map(fleet => fleet.commander)));

  const handleFleetDelete = async (fleet: Fleet) => {
    setFleetToDelete(fleet);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!fleetToDelete || !user) return;
    
    const { error } = await supabase
      .from('fleets')
      .delete()
      .eq('id', fleetToDelete.id)
      .eq('user_id', user.sub);

    if (error) {
      console.error('Error deleting fleet:', error);
    } else {
      fetchFleets();
    }
    setShowDeleteConfirmation(false);
    setFleetToDelete(null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sm font-normal h-9"
        >
          Fleet List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-background/80 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle>Your Fleets</DialogTitle>
          <div className="flex items-center space-x-2 mt-4">
            <Input
              placeholder="Filter fleets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Faction <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {uniqueFactions.map(faction => (
                  <DropdownMenuItem
                    key={faction}
                    onClick={() => setFactionFilter(prev => 
                      prev.includes(faction) 
                        ? prev.filter(f => f !== faction)
                        : [...prev, faction]
                    )}
                  >
                    {capitalizeFirstLetter(faction)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Commander <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {uniqueCommanders.map(commander => (
                  <DropdownMenuItem
                    key={commander}
                    onClick={() => setCommanderFilter(prev => 
                      prev.includes(commander)
                        ? prev.filter(c => c !== commander)
                        : [...prev, commander]
                    )}
                  >
                    {commander}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              {columns.filter(col => col.visible).map((column) => (
                <TableHead 
                  key={column.id}
                  className="cursor-pointer"
                  onClick={() => handleSort(column.id)}
                >
                  {column.label}
                  {sortColumn === column.id && (
                    <span className="ml-2">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </TableHead>
              ))}
              <TableHead className="w-[40px]">
                <MoreVertical className="h-4 w-4" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFleets.map((fleet) => (
              <TableRow key={fleet.id}>
                <TableCell>
                  <button
                    onClick={() => handleFleetSelect(fleet)}
                    className="text-blue-500 hover:underline"
                  >
                    {fleet.fleet_name}
                  </button>
                </TableCell>
                <TableCell>{capitalizeFirstLetter(fleet.faction)}</TableCell>
                <TableCell>{fleet.commander}</TableCell>
                <TableCell>{fleet.points}</TableCell>
                {columns.find(col => col.id === 'date_added')?.visible && (
                  <TableCell>{new Date(fleet.date_added).toLocaleDateString()}</TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleFleetSelect(fleet)}>
                        Load Fleet
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleFleetDelete(fleet)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-100/50"
                      >
                        Delete Fleet
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => setRowsPerPage(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
        {showDeleteConfirmation && fleetToDelete && (
          <NotificationWindow
            title="Delete Fleet"
            message={`Are you sure you want to delete "${fleetToDelete.fleet_name}"?`}
            onClose={() => {
              setShowDeleteConfirmation(false);
              setFleetToDelete(null);
            }}
            showConfirmButton={true}
            onConfirm={confirmDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
