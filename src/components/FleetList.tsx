import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreVertical, ChevronDown, Trash, Edit, Copy, Share } from 'lucide-react';
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
import { useMediaQuery } from '../hooks/use-media-query';

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

// Memoized table header component
const TableHeaderMemo = memo(({ 
  columns, 
  sortColumn, 
  sortDirection, 
  handleSort, 
  theme 
}: { 
  columns: SortableColumn[], 
  sortColumn: keyof Fleet, 
  sortDirection: 'asc' | 'desc',
  handleSort: (column: keyof Fleet) => void,
  theme: string | undefined
}) => (
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
));

TableHeaderMemo.displayName = 'TableHeaderMemo';

// Memoized fleet row component
const FleetRowMemo = memo(({ 
  fleet, 
  handleFleetSelect, 
  handleFleetDelete, 
  handleFleetCopy, 
  handleToggleShare, 
  handleCopyLink, 
  handleCopyText, 
  theme,
  columns,
  capitalizeFirstLetter,
  handleOpenRenameDialog,
  setFleetToRename,
  setNewFleetName,
  setShowRenameDialog
}: { 
  fleet: Fleet, 
  handleFleetSelect: (fleet: Fleet) => void,
  handleFleetDelete: (fleet: Fleet) => void,
  handleFleetCopy: (fleet: Fleet) => void,
  handleToggleShare: (fleet: Fleet) => void,
  handleCopyLink: (fleet: Fleet) => void,
  handleCopyText: (fleet: Fleet) => void,
  theme: string | undefined,
  columns: SortableColumn[],
  capitalizeFirstLetter: (s: string) => string,
  handleOpenRenameDialog: (fleet: Fleet) => void,
  setFleetToRename: (fleet: Fleet | null) => void,
  setNewFleetName: (name: string) => void,
  setShowRenameDialog: (show: boolean) => void
}) => (
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
                className="mr-2 cursor-not-allowed"
                disabled={true}
              />
              Share Fleet
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenRenameDialog(fleet)}>
            Rename Fleet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFleetCopy(fleet)}>
            Copy Fleet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyLink(fleet)}>
            Copy Share Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyText(fleet)}>
            Copy Fleet Text
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
));

FleetRowMemo.displayName = 'FleetRowMemo';

// Memoized pagination controls
const PaginationControls = memo(({
  currentPage,
  totalPages,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage
}: {
  currentPage: number,
  totalPages: number,
  setCurrentPage: (page: number | ((prev: number) => number)) => void,
  rowsPerPage: number,
  setRowsPerPage: (value: number) => void
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 border-t pt-4">
    <div className="flex items-center space-x-2">
      <Select
        value={rowsPerPage.toString()}
        onValueChange={(value: string) => {
          // Parse string to number before passing to the handler
          setRowsPerPage(parseInt(value, 10));
        }}
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
));

PaginationControls.displayName = 'PaginationControls';

// Debounce function to improve search performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Add a simplified fleet card component for mobile
const FleetCard = memo(({
  fleet,
  handleFleetSelect,
  handleFleetDelete,
  handleFleetCopy,
  handleToggleShare,
  handleCopyLink,
  handleCopyText,
  theme,
  handleOpenRenameDialog,
  setFleetToRename,
  setNewFleetName,
  setShowRenameDialog
}: {
  fleet: Fleet,
  handleFleetSelect: (fleet: Fleet) => void,
  handleFleetDelete: (fleet: Fleet) => void,
  handleFleetCopy: (fleet: Fleet) => void,
  handleToggleShare: (fleet: Fleet) => void,
  handleCopyLink: (fleet: Fleet) => void,
  handleCopyText: (fleet: Fleet) => void,
  theme: string | undefined,
  handleOpenRenameDialog: (fleet: Fleet) => void,
  setFleetToRename: (fleet: Fleet | null) => void,
  setNewFleetName: (name: string) => void,
  setShowRenameDialog: (show: boolean) => void
}) => (
  <Card className="mb-3">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => handleFleetSelect(fleet)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-lg font-medium"
        >
          {fleet.fleet_name}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                  className="mr-2 cursor-not-allowed"
                  disabled={true}
                />
                Share Fleet
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenRenameDialog(fleet)}>
              Rename Fleet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFleetCopy(fleet)}>
              Copy Fleet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopyLink(fleet)}>
              Copy Share Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCopyText(fleet)}>
              Copy Fleet Text
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleFleetDelete(fleet)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              Delete Fleet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-2 gap-1 text-sm">
        <div className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Faction:</div>
        <div className="font-medium">{fleet.faction.charAt(0).toUpperCase() + fleet.faction.slice(1)}</div>
        
        <div className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Commander:</div>
        <div className="font-medium">{fleet.commander}</div>
        
        <div className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>Points:</div>
        <div className="font-medium">{fleet.points}</div>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" className="h-8 p-1 px-2" onClick={() => handleFleetSelect(fleet)}>
          Load
        </Button>
        <Button variant="outline" size="sm" className="h-8 p-1 px-2" onClick={() => handleFleetCopy(fleet)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 p-1 px-2" onClick={() => handleToggleShare(fleet)}>
          <Share className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 p-1 px-2" onClick={() => handleOpenRenameDialog(fleet)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 p-1 px-2 text-destructive" onClick={() => handleFleetDelete(fleet)}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
));

FleetCard.displayName = 'FleetCard';

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
  const [factionDropdownOpen, setFactionDropdownOpen] = useState(false);
  const [commanderDropdownOpen, setCommanderDropdownOpen] = useState(false);
  const [commanderSearchQuery, setCommanderSearchQuery] = useState("");
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // Pagination for dropdown menus
  const [factionPage, setFactionPage] = useState(0);
  const [commanderPage, setCommanderPage] = useState(0);
  const ITEMS_PER_DROPDOWN_PAGE = 25;

  // Debounced search queries for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedCommanderSearchQuery = useDebounce(commanderSearchQuery, 300);

  // Add state for dialog open status
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Detect mobile screens
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Top Level
  const handleOpenRenameDialog = useCallback((fleet: Fleet) => {
    setFleetToRename(fleet);
    setNewFleetName(fleet.fleet_name);
    setShowRenameDialog(true);
  }, []); // Dependencies: setFleetToRename, setNewFleetName, setShowRenameDialog (which are stable)

  // Define fetchFleets before it's used
  const fetchFleets = useCallback(async () => {
    if (!user?.sub || !isMounted.current) return;
    
    console.log("Starting to fetch fleets...");
    setIsLoading(true);
    setLoadingMessage("Fetching your fleets...");
    setLoadingProgress(0);

    // Add timeout protection to ensure loading state doesn't persist indefinitely
    const timeoutId = setTimeout(() => {
      if (isMounted.current && isLoading) {
        console.log("Fetch timeout reached - resetting loading state");
        setIsLoading(false);
        setLoadingMessage("");
        setLoadingProgress(0);
      }
    }, 15000); // 15 second timeout as safety measure

    try {
      console.log(`Fetching fleets for user: ${user.sub?.slice(0, 5)}...`);
      const { data, error } = await supabase
        .from('fleets')
        .select('*')
        .eq('user_id', user.sub)
        .order('date_added', { ascending: false });

      if (error) {
        console.error('Error fetching fleets:', error);
        setIsLoading(false);
        setLoadingMessage("");
        return;
      }
      
      if (!isMounted.current) {
        clearTimeout(timeoutId);
        return;
      }
      
      console.log(`Received ${data?.length || 0} fleets, processing data...`);
      setLoadingProgress(50);
      
      // Create processed fleets directly without the complex chunking mechanism
      // that might be causing issues
      const processedFleets = (data || []).map(fleet => {
        const contentTypes = getContentTypes(fleet.fleet_data);
        return {
          ...fleet,
          legends: contentTypes.legends,
          legacy: contentTypes.legacy,
          old_legacy: contentTypes.old_legacy,
          arc: contentTypes.arc
        };
      });
      
      if (!isMounted.current) {
        clearTimeout(timeoutId);
        return;
      }
      
      // Simplify Supabase update - only update if needed
      const fleetsNeedingUpdate = processedFleets.filter(fleet => 
        fleet.legends !== getContentTypes(fleet.fleet_data).legends ||
        fleet.legacy !== getContentTypes(fleet.fleet_data).legacy ||
        fleet.old_legacy !== getContentTypes(fleet.fleet_data).old_legacy ||
        fleet.arc !== getContentTypes(fleet.fleet_data).arc
      );
      
      // Update content flags in database if needed, but continue regardless
      if (fleetsNeedingUpdate.length > 0) {
        console.log(`Updating content types for ${fleetsNeedingUpdate.length} fleets`);
        try {
          await supabase.from('fleets').upsert(fleetsNeedingUpdate);
        } catch (updateError) {
          console.error('Error updating content types:', updateError);
          // Continue anyway - this isn't critical
        }
      }
      
      setLoadingProgress(100);
      console.log("Setting fleets data and completing load");
      setFleets(processedFleets);
    } catch (error) {
      console.error('Error in fetchFleets:', error);
    } finally {
      clearTimeout(timeoutId);
      if (isMounted.current) {
        setIsLoading(false);
        setLoadingMessage("");
        setLoadingProgress(0);
      }
    }
  }, [user?.sub, isLoading]);
  
  // Only fetch fleets when dialog is opened
  const handleDialogOpenChange = useCallback((open: boolean) => {
    console.log(`Dialog open state changed to: ${open}`);
    setIsDialogOpen(open);
    if (open && user) {
      fetchFleets();
    }
  }, [user, fetchFleets]);

  const handleFleetSelect = useCallback((fleet: Fleet) => {
    // Clear any existing fleet data for all factions
    const factions = ['rebel', 'empire', 'republic', 'separatist', 'unsc', 'covenant', 'colonial', 'cylon', 'sandbox', 'scum', 'new-republic'];
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
  }, [router]);

  const handleSort = useCallback((column: keyof Fleet) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn, sortDirection]);

  const capitalizeFirstLetter = useCallback((string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }, []);

  // Memoize expensive calculations
  const filteredFleets = useMemo(() => {
    return fleets
      .filter(fleet => {
        const matchesSearch = debouncedSearchQuery === '' || 
          fleet.fleet_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
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
  }, [fleets, debouncedSearchQuery, factionFilter, commanderFilter, sortColumn, sortDirection]);

  const totalPages = useMemo(() => Math.ceil(filteredFleets.length / rowsPerPage), [filteredFleets.length, rowsPerPage]);
  
  const paginatedFleets = useMemo(() => {
    return filteredFleets.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredFleets, currentPage, rowsPerPage]);

  // Memoize dropdown data to avoid recalculating on each render
  const uniqueFactions = useMemo(
    () => {
      const factions = Array.from(new Set(fleets.map(fleet => fleet.faction)));
      return factions.map(faction => faction && faction.trim() !== '' ? faction : 'unknown');
    },
    [fleets]
  );
  
  const uniqueCommanders = useMemo(
    () => {
      const commanders = Array.from(new Set(fleets.map(fleet => fleet.commander)));
      return commanders.map(commander => commander && commander.trim() !== '' ? commander : 'unknown');
    },
    [fleets]
  );
  
  // Filter and paginate commanders for dropdown
  const filteredCommanders = useMemo(() => {
    return uniqueCommanders
      .filter(commander => 
        debouncedCommanderSearchQuery === '' || 
        commander.toLowerCase().includes(debouncedCommanderSearchQuery.toLowerCase()))
      .sort();
  }, [uniqueCommanders, debouncedCommanderSearchQuery]);

  const paginatedCommanders = useMemo(() => {
    return filteredCommanders.slice(
      commanderPage * ITEMS_PER_DROPDOWN_PAGE,
      (commanderPage + 1) * ITEMS_PER_DROPDOWN_PAGE
    );
  }, [filteredCommanders, commanderPage]);

  const paginatedFactions = useMemo(() => {
    return uniqueFactions.slice(
      factionPage * ITEMS_PER_DROPDOWN_PAGE,
      (factionPage + 1) * ITEMS_PER_DROPDOWN_PAGE
    );
  }, [uniqueFactions, factionPage]);

  const totalCommanderPages = useMemo(() => 
    Math.ceil(filteredCommanders.length / ITEMS_PER_DROPDOWN_PAGE),
    [filteredCommanders.length]
  );

  const totalFactionPages = useMemo(() => 
    Math.ceil(uniqueFactions.length / ITEMS_PER_DROPDOWN_PAGE),
    [uniqueFactions.length]
  );

  const handleFleetDelete = useCallback(async (fleet: Fleet) => {
    setFleetToDelete(fleet);
    setShowDeleteConfirmation(true);
  }, []);

  const confirmDelete = useCallback(async () => {
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
  }, [fleetToDelete, user, fetchFleets]);

  const handleFleetRename = useCallback(async () => {
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
  }, [fleetToRename, user, newFleetName, fetchFleets]);

  const handleFleetCopy = useCallback(async (fleet: Fleet) => {
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
  }, [user, fetchFleets]);

  const handleToggleShare = useCallback(async (fleet: Fleet) => {
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
  }, [user, fetchFleets]);

  const handleCopyLink = useCallback(async (fleet: Fleet) => {
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
  }, []);

  const handleCopyText = useCallback(async (fleet: Fleet) => {
    try {
      await navigator.clipboard.writeText(fleet.fleet_data);
      setNotificationMessage('Fleet text copied to clipboard!');
      setShowNotification(true);
    } catch (err) {
      console.error('Failed to copy fleet text:', err);
      setNotificationMessage('Failed to copy fleet text to clipboard');
      setShowNotification(true);
    }
  }, []);

  // Add memoized handlers for dropdown interactions
  const handleFactionPageChange = useCallback((direction: 'prev' | 'next') => {
    setFactionPage(prev => {
      if (direction === 'prev') {
        return Math.max(0, prev - 1);
      } else {
        return Math.min(totalFactionPages - 1, prev + 1);
      }
    });
  }, [totalFactionPages]);

  const handleCommanderPageChange = useCallback((direction: 'prev' | 'next') => {
    setCommanderPage(prev => {
      if (direction === 'prev') {
        return Math.max(0, prev - 1);
      } else {
        return Math.min(totalCommanderPages - 1, prev + 1);
      }
    });
  }, [totalCommanderPages]);

  const handleFactionFilterChange = useCallback((faction: string) => {
    setFactionFilter(prev => 
      prev.includes(faction) 
        ? prev.filter(f => f !== faction)
        : [...prev, faction]
    );
  }, []);

  const handleCommanderFilterChange = useCallback((commander: string) => {
    setCommanderFilter(prev => 
      prev.includes(commander)
        ? prev.filter(c => c !== commander)
        : [...prev, commander]
    );
  }, []);

  const handleCommanderSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCommanderSearchQuery(e.target.value);
    setCommanderPage(0); // Reset to first page when searching
  }, []);

  const handleSearchQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleRowsPerPageChange = useCallback((value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing rows per page
  }, []);

  // Reset isMounted ref when unmounting
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Don't auto-fetch fleets when user changes - only fetch when dialog opens
  // This was causing unnecessary loading and potential race conditions
  useEffect(() => {
    // Clear any loading state if user is not logged in
    if (!user) {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingProgress(0);
    }
  }, [user]);

  // Use Effect to reset paging when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, factionFilter, commanderFilter]);

  // Mobile-specific UI content for Sheet component
  const mobileContent = useMemo(() => {
    if (!isDialogOpen) return null;
    
    return (
      <SheetContent 
        className="w-screen h-[100dvh] max-w-none p-0 border-0 rounded-none mt-0 pt-6 flex flex-col"
        side="bottom"
      >
        <SheetHeader className="px-4 pb-2">
          <SheetTitle className="text-center text-xl">Your Fleets</SheetTitle>
          <div className="flex flex-col gap-3 mt-3">
            <Input
              placeholder="Filter fleets..."
              value={searchQuery}
              onChange={handleSearchQueryChange}
              className="w-full"
            />
            <div className="flex gap-2">
              <Select
                value={factionFilter.length ? factionFilter[0] : "all"}
                onValueChange={(value) => {
                  setFactionFilter(value === "all" ? [] : [value]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by faction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Factions</SelectItem>
                  {uniqueFactions.map(faction => (
                    <SelectItem key={faction} value={faction}>
                      {faction === 'unknown' ? 'Unknown' : faction.charAt(0).toUpperCase() + faction.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={commanderFilter.length ? commanderFilter[0] : "all-commanders"}
                onValueChange={(value) => {
                  setCommanderFilter(value === "all-commanders" ? [] : [value]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by commander" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-commanders">All Commanders</SelectItem>
                  {uniqueCommanders.map(commander => (
                    <SelectItem key={commander} value={commander}>
                      {commander === 'unknown' ? 'Unknown' : commander}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-auto px-4 pb-24">
          {isLoading && fleets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading your fleets...</p>
            </div>
          ) : (
            <>
              {fleets.length === 0 ? (
                <div className="text-center py-8">
                  <p>No fleets found. Create and save a fleet to see it here.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {paginatedFleets.map((fleet) => (
                    <FleetCard
                      key={fleet.id}
                      fleet={fleet}
                      handleFleetSelect={handleFleetSelect}
                      handleFleetDelete={handleFleetDelete}
                      handleFleetCopy={handleFleetCopy}
                      handleToggleShare={handleToggleShare}
                      handleCopyLink={handleCopyLink}
                      handleCopyText={handleCopyText}
                      theme={theme}
                      handleOpenRenameDialog={handleOpenRenameDialog}
                      setFleetToRename={setFleetToRename}
                      setNewFleetName={setNewFleetName}
                      setShowRenameDialog={setShowRenameDialog}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {fleets.length > 0 && (
          <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 flex flex-row justify-between items-center border-t bg-background/95 backdrop-blur-sm pb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </SheetFooter>
        )}
        
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
      </SheetContent>
    );
  }, [
    isDialogOpen,
    isLoading,
    fleets.length,
    searchQuery,
    handleSearchQueryChange,
    factionFilter,
    commanderFilter,
    uniqueFactions,
    uniqueCommanders,
    paginatedFleets,
    theme,
    handleFleetSelect,
    handleFleetDelete,
    handleFleetCopy,
    handleToggleShare,
    handleCopyLink,
    handleCopyText,
    handleOpenRenameDialog,
    currentPage,
    totalPages,
    showDeleteConfirmation,
    fleetToDelete,
    confirmDelete
  ]);

  // Memoize dialog render content to avoid re-rendering when closed
  const dialogContent = useMemo(() => {
    if (!isDialogOpen) return null;
    
    return (
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
              onChange={handleSearchQueryChange}
              className="max-w-sm"
            />
            <DropdownMenu open={factionDropdownOpen} onOpenChange={setFactionDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Faction <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] overflow-auto">
                {paginatedFactions.map(faction => (
                  <DropdownMenuItem
                    key={faction}
                    onClick={() => handleFactionFilterChange(faction)}
                  >
                    {faction === 'unknown' ? 'Unknown' : faction.charAt(0).toUpperCase() + faction.slice(1)}
                  </DropdownMenuItem>
                ))}
                {totalFactionPages > 1 && (
                  <div className="flex justify-between p-2 border-t mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleFactionPageChange('prev');
                      }}
                      disabled={factionPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-xs self-center">
                      Page {factionPage + 1} of {totalFactionPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleFactionPageChange('next');
                      }}
                      disabled={factionPage >= totalFactionPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu open={commanderDropdownOpen} onOpenChange={setCommanderDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Commander <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] overflow-auto">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search commanders..."
                    value={commanderSearchQuery}
                    onChange={handleCommanderSearchChange}
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 text-xs"
                  />
                </div>
                {paginatedCommanders.map(commander => (
                  <DropdownMenuItem
                    key={commander}
                    onClick={() => handleCommanderFilterChange(commander)}
                  >
                    {commander === 'unknown' ? 'Unknown' : commander}
                  </DropdownMenuItem>
                ))}
                {totalCommanderPages > 1 && (
                  <div className="flex justify-between p-2 border-t mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleCommanderPageChange('prev');
                      }}
                      disabled={commanderPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-xs self-center">
                      Page {commanderPage + 1} of {totalCommanderPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleCommanderPageChange('next');
                      }}
                      disabled={commanderPage >= totalCommanderPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading && fleets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading your fleets...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto px-4 pb-24">
              {isLoading && fleets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Loading your fleets...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {fleets.length === 0 ? (
                    <div className="text-center py-8">
                      <p>No fleets found. Create and save a fleet to see it here.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeaderMemo 
                        columns={columns} 
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        handleSort={handleSort}
                        theme={theme}
                      />
                      <TableBody>
                        {paginatedFleets.map((fleet) => (
                          <FleetRowMemo
                            key={fleet.id}
                            fleet={fleet}
                            handleFleetSelect={handleFleetSelect}
                            handleFleetDelete={handleFleetDelete}
                            handleFleetCopy={handleFleetCopy}
                            handleToggleShare={handleToggleShare}
                            handleCopyLink={handleCopyLink}
                            handleCopyText={handleCopyText}
                            theme={theme}
                            columns={columns}
                            capitalizeFirstLetter={capitalizeFirstLetter}
                            handleOpenRenameDialog={handleOpenRenameDialog}
                            setFleetToRename={setFleetToRename}
                            setNewFleetName={setNewFleetName}
                            setShowRenameDialog={setShowRenameDialog}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {fleets.length > 0 && (
          <SheetFooter className="fixed bottom-0 left-0 right-0 p-4 flex flex-row justify-between items-center border-t bg-background/95 backdrop-blur-sm pb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </SheetFooter>
        )}
        
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
    );
  }, [
    isDialogOpen,
    isLoading,
    fleets.length,
    theme, 
    searchQuery, 
    handleSearchQueryChange,
    factionDropdownOpen, 
    setFactionDropdownOpen,
    paginatedFactions,
    handleFactionFilterChange,
    capitalizeFirstLetter,
    totalFactionPages,
    handleFactionPageChange,
    factionPage,
    commanderDropdownOpen,
    setCommanderDropdownOpen,
    commanderSearchQuery,
    handleCommanderSearchChange,
    paginatedCommanders,
    handleCommanderFilterChange,
    totalCommanderPages,
    handleCommanderPageChange,
    commanderPage,
    columns,
    sortColumn,
    sortDirection,
    handleSort,
    paginatedFleets,
    handleFleetSelect,
    handleFleetDelete,
    handleFleetCopy,
    handleToggleShare,
    handleCopyLink,
    handleCopyText,
    handleOpenRenameDialog,
    currentPage,
    totalPages,
    setCurrentPage,
    rowsPerPage,
    handleRowsPerPageChange,
    showDeleteConfirmation,
    fleetToDelete,
    confirmDelete,
    showRenameDialog,
    fleetToRename,
    newFleetName,
    handleFleetRename,
    showNotification,
    notificationMessage
  ]);

  // Return either the Dialog or Sheet based on screen size
  return (
    <>
      {/* Only show the global loading screen when absolutely necessary */}
      {isLoading && !isDialogOpen && (
        <LoadingScreen progress={loadingProgress} message={loadingMessage} />
      )}
      
      {isMobile ? (
        <Sheet open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm font-normal h-9 bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Fleet List
            </Button>
          </SheetTrigger>
          {mobileContent}
        </Sheet>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm font-normal h-9 bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Fleet List
            </Button>
          </DialogTrigger>
          {dialogContent}
        </Dialog>
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
    </>
  );
}
