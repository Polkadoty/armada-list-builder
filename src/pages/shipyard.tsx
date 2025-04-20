import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import StarryBackground from "@/components/StarryBackground";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Download, Search, X, Home, ThumbsUp, FolderOpen, Menu, ChevronLeft } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';
import { SortToggleGroup, SortOption } from '@/components/SortToggleGroup';
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/UserAvatar";
import Link from 'next/link';

const standardFactions = ['empire', 'rebel', 'republic', 'separatist', 'scum', 'new-republic'];

interface ShipyardItem {
  id: string;
  name: string;
  cardimage: string;
  author: string;
  type: 'squadron' | 'ship' | 'upgrade';
  faction: string;
  downloads: number;
  likes: number;
  created_at: string;
  unique: boolean;
}

// const Nav = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
//   return (
//     <nav
//       className={cn("flex flex-col space-y-4", className)}
//       {...props}
//     >
//       <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-white">
//         <Home className="mr-2 h-4 w-4" />
//         <span>Home</span>
//       </Button>
//       <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-white">
//         <ThumbsUp className="mr-2 h-4 w-4" />
//         <span>My Likes</span>
//       </Button>
//       <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-white">
//         <Heart className="mr-2 h-4 w-4" />
//         <span>My Faves</span>
//       </Button>
//       <Button variant="ghost" className="w-full justify-start text-gray-900 dark:text-white">
//         <FolderOpen className="mr-2 h-4 w-4" />
//         <span>Collections</span>
//       </Button>
//     </nav>
//   );
// };

export default function Shipyard() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  /*eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [sortBy, setSortBy] = useState<'new'|'popular'|'rating'>('new');
  /*eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [contentType, setContentType] = useState<'squadron'|'ship'|'upgrade'>('squadron');
  const [items, setItems] = useState<ShipyardItem[]>([]);
  const [selectedFaction, setSelectedFaction] = useState<string>('all');
  const [filters, setFilters] = useState({
    upgrades: true,
    ships: true,
    squadrons: true,
    unique: false,
    customFaction: false
  });

  const [activeSorts, setActiveSorts] = useState<Record<SortOption, "desc" | "asc" | null>>({
    unique: null,
    alphabetical: null,
    points: null,
    custom: null
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSortToggle = (sort: string) => {
    setActiveSorts(prev => 
      prev[sort as SortOption] === null ? { ...prev, [sort as SortOption]: 'desc' } : { ...prev, [sort as SortOption]: null }
    );
  };

  useEffect(() => {
    const fetchItems = async () => {
      let query = supabase
        .from(`custom_${contentType}s`)
        .select('*')
        .eq('published', true);
  
      if (selectedFaction !== 'all') {
        query = query.eq('faction', selectedFaction);
      }
  
      if (filters.customFaction) {
        query = query.not('faction', 'in', `(${standardFactions.join(',')})`);
      }
  
      if (filters.unique) {
        query = query.eq('unique', true);
      }
  
      query = query.order(
        sortBy === 'new' ? 'created_at' : 
        sortBy === 'popular' ? 'downloads_count' : 
        'average_rating', 
        { ascending: false }
      );
  
      const { data, error } = await query;
      
      if (!error && data) {
        setItems(data);
      }
    };

    fetchItems();
  }, [contentType, selectedFaction, filters, sortBy, standardFactions]);

  return (
    <>
      <StarryBackground show={true} />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-full items-center px-4">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="text-zinc-900 dark:text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="lg:hidden text-zinc-900 dark:text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl font-bold logo-font text-zinc-900 dark:text-white">Shipyard</h1>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <UserAvatar />
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="flex min-h-[calc(100vh-3.5rem)]">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-48 border-r transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
            sidebarOpen 
              ? "translate-x-0 bg-background" 
              : "-translate-x-full",
            "lg:bg-background"
          )}>
            <div className="flex justify-end p-4 lg:hidden">
              <Button variant="ghost" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-3.5rem)] p-4">
              <nav className="flex flex-col space-y-4">
                <Button variant="ghost" className="w-full justify-start text-zinc-900 dark:text-white">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-zinc-900 dark:text-white">
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  <span>My Likes</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-zinc-900 dark:text-white">
                  <Heart className="mr-2 h-4 w-4" />
                  <span>My Faves</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-zinc-900 dark:text-white">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  <span>Collections</span>
                </Button>
              </nav>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 w-full">
            {/* Top Controls */}
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 w-full relative">
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pr-10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-900 dark:text-white h-4 w-4" />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')} 
                  className="w-full sm:w-auto text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Clear
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <Select value={selectedFaction} onValueChange={setSelectedFaction}>
                  <SelectTrigger className="w-full sm:w-[180px] text-zinc-900 dark:text-white">
                    <SelectValue placeholder="Select Faction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-zinc-900 dark:text-white">All Factions</SelectItem>
                    {standardFactions.map(faction => (
                      <SelectItem key={faction} value={faction} className="text-zinc-900 dark:text-white">
                        {faction.charAt(0).toUpperCase() + faction.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex flex-wrap items-center gap-4">
                  {Object.entries(filters).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox 
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => 
                          setFilters(f => ({...f, [key]: !!checked}))}
                      />
                      <label 
                        htmlFor={key}
                        className="text-sm font-medium text-zinc-900 dark:text-white capitalize cursor-pointer whitespace-nowrap"
                      >
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center sm:justify-start overflow-x-auto py-2 w-full">
                <div className="min-w-fit">
                  <SortToggleGroup 
                    activeSorts={activeSorts} 
                    onToggle={handleSortToggle}
                    selectorType="squadrons"
                  />
                </div>
              </div>
            </div>

            {/* Content Cards */}
            <div className="grid grid-cols-1 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden bg-white dark:bg-zinc-800">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-96 h-64">
                        <OptimizedImage
                          src={item.cardimage}
                          alt={item.name}
                          width={384}
                          height={256}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{item.name}</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              by {item.author}
                            </p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Faction: {item.faction}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="icon" variant="outline">
                              <Heart className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
