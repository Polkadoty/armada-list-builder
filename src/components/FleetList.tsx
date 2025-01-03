import { useState, useEffect, useCallback } from 'react';
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
import { useTheme } from 'next-themes';
import { LoadingScreen } from "@/components/LoadingScreen";
import { Checkbox } from "@/components/ui/checkbox";

interface Fleet {
  id: string;
  fleet_name: string;
  faction: string;
  commander: string;
  points: number;
  date_added: string;
  fleet_data: string;
  legends?: boolean;
  legacy?: boolean;
  old_legacy?: boolean;
  arc?: boolean;
  numerical_id?: string;
  shared?: boolean;
}

interface SortableColumn {
  id: keyof Fleet;
  label: string;
  sortable: boolean;
  visible: boolean;
}

export const getContentTypes = (fleetData: string) => {
  return {
    legends: fleetData.includes("[Legends]"),
    legacy: fleetData.includes("[Legacy]"),
    old_legacy: fleetData.includes("[OldLegacy]"),
    arc: fleetData.includes("[ARC]")
  };
};

const columns: SortableColumn[] = [
  { id: 'fleet_name', label: 'Fleet Name', sortable: true, visible: true },
  { id: 'faction', label: 'Faction', sortable: true, visible: true },
  { id: 'commander', label: 'Commander', sortable: true, visible: true },
  { id: 'points', label: 'Points', sortable: true, visible: true },
  { id: 'date_added', label: 'Date Added', sortable: true, visible: false },
];



export function FleetList() {
  const { theme } = useTheme();
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
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [fleetToRename, setFleetToRename] = useState<Fleet | null>(null);
  const [newFleetName, setNewFleetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const fetchFleets = useCallback(async () => {
    setIsLoading(true);
    setLoadingMessage("Fetching your fleets...");
    setLoadingProgress(0);

    try {
      const { data, error } = await supabase
        .from('fleets')
        .select('*')
        .eq('user_id', user?.sub)
        .order('date_added', { ascending: false });

      if (error) {
        console.error('Error fetching fleets:', error);
      } else {
        // Update content type flags for each fleet
        const updatedFleets = data?.map(fleet => {
          const contentTypes = getContentTypes(fleet.fleet_data);
          return {
            ...fleet,
            legends: contentTypes.legends,
            legacy: contentTypes.legacy,
            old_legacy: contentTypes.old_legacy
          };
        });

        // Batch update the fleets in supabase
        if (updatedFleets?.length) {
          const { error: updateError } = await supabase
            .from('fleets')
            .upsert(updatedFleets);

          if (updateError) {
            console.error('Error updating fleet content types:', updateError);
          }
        }

        setLoadingProgress(100);
        setFleets(updatedFleets || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingProgress(0);
    }
  }, [user?.sub]);

  const handleFleetSelect = (fleet: Fleet) => {
    // Clear any existing fleet data for all factions
    const factions = ['rebel', 'empire', 'republic', 'separatist'];
    factions.forEach(faction => {
      localStorage.removeItem(`savedFleet_${faction}`);
    });

    // Set the flag and new fleet data
    document.cookie = "retrieved-from-list=true; path=/";
    localStorage.setItem(`savedFleet_${fleet.faction}`, fleet.fleet_data);
    
    // If we're already on a faction page, first navigate to home to force a component reset
    if (router.pathname.includes('[faction]')) {
      router.push('/').then(() => {
        setTimeout(() => {
          router.push(`/${fleet.faction}`);
        }, 250);
      });
    } else {
      router.push(`/${fleet.faction}`);
    }
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
      const aValue = a[sortColumn] !== undefined ? a[sortColumn] : '';
      const bValue = b[sortColumn] !== undefined ? b[sortColumn] : '';
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
    
    setIsLoading(true);
    setLoadingMessage(`Deleting fleet: ${fleetToDelete.fleet_name}`);
    setLoadingProgress(50);

    try {
      const { error } = await supabase
        .from('fleets')
        .delete()
        .eq('id', fleetToDelete.id)
        .eq('user_id', user.sub);

      if (error) {
        console.error('Error deleting fleet:', error);
      } else {
        setLoadingProgress(100);
        await fetchFleets();
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingProgress(0);
      setShowDeleteConfirmation(false);
      setFleetToDelete(null);
    }
  };

  const handleFleetRename = async () => {
    if (!fleetToRename || !user || !newFleetName.trim()) return;
    
    setIsLoading(true);
    setLoadingMessage(`Renaming fleet to: ${newFleetName}`);
    setLoadingProgress(50);

    try {
      let updatedFleetData = fleetToRename.fleet_data;
      try {
        updatedFleetData = fleetToRename.fleet_data.replace(
          /Name: .*$/m,
          `Name: ${newFleetName.trim()}`
        );
      } catch (error) {
        console.error('Error updating fleet data name:', error);
      }

      const { error } = await supabase
        .from('fleets')
        .update({ 
          fleet_name: newFleetName.trim(),
          fleet_data: updatedFleetData
        })
        .eq('id', fleetToRename.id)
        .eq('user_id', user.sub);

      if (error) {
        console.error('Error renaming fleet:', error);
      } else {
        setLoadingProgress(100);
        await fetchFleets();
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingProgress(0);
      setShowRenameDialog(false);
      setFleetToRename(null);
      setNewFleetName('');
    }
  };

  const handleFleetCopy = async (fleet: Fleet) => {
    if (!user) return;
    
    setIsLoading(true);
    setLoadingMessage(`Creating copy of: ${fleet.fleet_name}`);
    setLoadingProgress(50);

    try {
      const newFleetName = `${fleet.fleet_name} (Copy)`;
      const contentTypes = getContentTypes(fleet.fleet_data);
      
      const { error } = await supabase
        .from('fleets')
        .insert({ 
          user_id: user.sub,
          fleet_name: newFleetName,
          fleet_data: fleet.fleet_data,
          faction: fleet.faction,
          commander: fleet.commander,
          points: fleet.points,
          legends: contentTypes.legends,
          legacy: contentTypes.legacy,
          old_legacy: contentTypes.old_legacy
        });

      if (error) {
        console.error('Error copying fleet:', error);
      } else {
        setLoadingProgress(100);
        await fetchFleets();
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingProgress(0);
    }
  };

  const handleToggleShare = async (fleet: Fleet) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('fleets')
        .update({ shared: !fleet.shared })
        .eq('id', fleet.id)
        .eq('user_id', user.sub);

      if (error) throw error;
      
      // Show share link if enabled
      if (!fleet.shared) {
        setNotificationMessage(`Fleet can now be shared at: ${window.location.origin}/share/${fleet.numerical_id}`);
        setShowNotification(true);
      }
      
      await fetchFleets();
    } catch (error) {
      console.error('Error toggling share status:', error);
    }
  };

  const handleCopyLink = async (fleet: Fleet) => {
    if (!fleet.shared) {
      setNotificationMessage('Please enable sharing for this fleet first');
      setShowNotification(true);
      return;
    }

    // Use star-forge.tools domain or current domain if in production
    const domain = process.env.NEXT_PUBLIC_DOMAIN || window.location.origin;
    const shareUrl = `${domain}/share/${fleet.numerical_id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotificationMessage('Share link copied to clipboard!');
      setShowNotification(true);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setNotificationMessage('Failed to copy link to clipboard');
      setShowNotification(true);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFleets();
    }
  }, [user, fetchFleets]);

  return (
    <>
      {isLoading && (
        <LoadingScreen progress={loadingProgress} message={loadingMessage} />
      )}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sm font-normal h-9 bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Fleet List
          </Button>
        </DialogTrigger>
        <DialogContent className={`max-w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col border backdrop-blur-md ${
          theme === 'light' 
            ? 'bg-white/95 text-black' 
            : 'bg-background/80 text-white'
        }`}>
          <DialogHeader>
            <DialogTitle>Your Fleets</DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-4">
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

          <div className="flex-1 min-h-0 overflow-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-muted/50">
                    {columns.filter(col => col.visible).map((column) => (
                      <TableHead 
                        key={column.id}
                        className={`cursor-pointer hover:text-accent-foreground ${
                          theme === 'light' ? 'text-black' : 'text-white'
                        }`}
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
                    <TableRow key={fleet.id} className={`hover:bg-muted/50 border-b ${
                      theme === 'light' ? 'text-slate-900' : 'text-foreground'
                    }`}>
                      <TableCell>
                        <button
                          onClick={() => handleFleetSelect(fleet)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                        >
                          {fleet.fleet_name}
                        </button>
                      </TableCell>
                      <TableCell className={
                        theme === 'light' ? 'text-black' : 'text-white'
                      }>{capitalizeFirstLetter(fleet.faction)}</TableCell>
                      <TableCell className={theme === 'light' ? 'text-black' : 'text-white'}>{fleet.commander}</TableCell>
                      <TableCell className={theme === 'light' ? 'text-black' : 'text-white'}>{fleet.points}</TableCell>
                      {columns.find(col => col.id === 'date_added')?.visible && (
                        <TableCell>{new Date(fleet.date_added).toLocaleDateString()}</TableCell>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleFleetSelect(fleet)}>
                              Load Fleet
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleShare(fleet)}>
                              <div className="flex items-center">
                                <Checkbox
                                  checked={fleet.shared}
                                  className="mr-2"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                Share Fleet
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setFleetToRename(fleet);
                              setNewFleetName(fleet.fleet_name);
                              setShowRenameDialog(true);
                            }}>
                              Rename Fleet
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFleetCopy(fleet)}>
                              Copy Fleet
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(fleet)}>
                              Copy Share Link
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleFleetDelete(fleet)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
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
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 border-t pt-4">
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
          {showRenameDialog && fleetToRename && (
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Rename Fleet</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Input
                      id="name"
                      value={newFleetName}
                      onChange={(e) => setNewFleetName(e.target.value)}
                      className="col-span-4"
                      placeholder="Enter new fleet name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowRenameDialog(false);
                      setFleetToRename(null);
                      setNewFleetName('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleFleetRename}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {showNotification && (
            <NotificationWindow
              message={notificationMessage}
              onClose={() => setShowNotification(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
