import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { ChevronDown, Eye, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { ImageModal } from './ImageModal';

const contentTypes = ['Ships', 'Squadrons', 'Upgrades', 'Objectives'];

interface LocalContentListProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function LocalContentList({ isOpen, setIsOpen }: LocalContentListProps) {
  const [contentType, setContentType] = useState<string>('ships');
  const [searchQuery, setSearchQuery] = useState('');
  const [factionFilter, setFactionFilter] = useState<string[]>([]);
  const { theme } = useTheme();
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const getContent = () => {
    try {
      let content;
      switch (contentType.toLowerCase()) {
        case 'ships':
          content = JSON.parse(localStorage.getItem('localShips') || '{"ships": {}}').ships;
          return Object.entries(content).flatMap(([chassisId, ship]) => {
            const models = (ship as any).models || {};
            return Object.entries(models).map(([modelId, model]) => ({
              id: modelId,
              name: (model as any).name || (model as any).chassis_name || modelId,
              faction: (model as any).faction || 'N/A',
              type: contentType,
              points: (model as any).points || 0,
              cardimage: (model as any).cardimage || ''
            }));
          });
        case 'squadrons':
          content = JSON.parse(localStorage.getItem('localSquadrons') || '{"squadrons": {}}').squadrons;
          break;
        case 'upgrades':
          content = JSON.parse(localStorage.getItem('localUpgrades') || '{"upgrades": {}}').upgrades;
          break;
        case 'objectives':
          content = JSON.parse(localStorage.getItem('localObjectives') || '{"objectives": {}}').objectives;
          break;
        default:
          return [];
      }

      return Object.entries(content).map(([id, item]) => ({
        id,
        name: (item as any).name || id,
        faction: (item as any).faction || 'N/A',
        type: contentType,
        points: (item as any).points || 0,
        cardimage: (item as any).cardimage || ''
      }));
    } catch (error) {
      console.error('Error parsing local content:', error);
      return [];
    }
  };

  const content = getContent();
  const uniqueFactions = Array.from(new Set(content.map(item => item.faction)));

  const filteredContent = content.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFaction = factionFilter.length === 0 || factionFilter.includes(item.faction);
    return matchesSearch && matchesFaction;
  });

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleShowImage = (image: string) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleRemoveItem = (id: string, type: string) => {
    try {
      if (type === 'ships') {
        const localShips = JSON.parse(localStorage.getItem('localShips') || '{"ships": {}}');
        // Find and remove the model from its chassis
        Object.keys(localShips.ships).forEach(chassisId => {
          const models = localShips.ships[chassisId].models;
          if (models && models[id]) {
            delete models[id];
            // Remove chassis if no models left
            if (Object.keys(models).length === 0) {
              delete localShips.ships[chassisId];
            }
          }
        });
        localStorage.setItem('localShips', JSON.stringify(localShips));
      } else {
        const storageKey = `local${capitalizeFirstLetter(type)}`;
        const content = JSON.parse(localStorage.getItem(storageKey) || `{"${type}": {}}`);
        delete content[`${type}`][id];
        localStorage.setItem(storageKey, JSON.stringify(content));
      }
      
      // Force re-render by updating state
      setContentType(prev => prev);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className={`max-w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col border backdrop-blur-md ${
        theme === 'light' 
          ? 'bg-white/95 text-black' 
          : 'bg-background/80 text-white'
      }`}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Local Content</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label className="text-sm font-medium">Content Type</Label>
              <Select value={contentType} onValueChange={(value) => setContentType(value)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ships">Ships</SelectItem>
                  <SelectItem value="squadrons">Squadrons</SelectItem>
                  <SelectItem value="upgrades">Upgrades</SelectItem>
                  <SelectItem value="objectives">Objectives</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label className="text-sm font-medium">Search</Label>
              <Input
                className="h-8"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1">
              <Label className="text-sm font-medium">Filter</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 w-full">
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
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Faction</TableHead>
                  <TableHead className="font-medium">Type</TableHead>
                  <TableHead className="font-medium text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="flex items-center gap-2">
                      {item.cardimage && (
                        <button
                          className="p-1 hover:bg-muted rounded"
                          onClick={() => handleShowImage(item.cardimage)}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {item.name}
                    </TableCell>
                    <TableCell>{capitalizeFirstLetter(item.faction)}</TableCell>
                    <TableCell>{capitalizeFirstLetter(item.type)}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      {item.points}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRemoveItem(item.id, item.type)}
                            className="text-red-600"
                          >
                            Remove
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
      </DialogContent>

      <ImageModal
        src={selectedImage}
        alt={selectedImage}
        onClose={() => setShowImageModal(false)}
      />
    </Dialog>
  );
} 
