import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowUpAZ, ArrowDownAZ, ArrowUpNarrowWide, ArrowDownWideNarrow, Star, StarOff, Pencil, PencilOff } from 'lucide-react';

export type SortOption = 'alphabetical' | 'points' | 'unique' | 'custom';

interface SortToggleGroupProps {
  activeSorts: Record<SortOption, 'asc' | 'desc' | null>;
  onToggle: (option: SortOption) => void;
}

export function SortToggleGroup({ activeSorts, onToggle }: SortToggleGroupProps) {
  const getIcon = (option: SortOption) => {
    if (activeSorts[option] === null) {
      switch (option) {
        case 'alphabetical':
          return <ArrowUpAZ />;
        case 'points':
          return <ArrowUpNarrowWide />;
        case 'unique':
          return <Star />;
        case 'custom':
          return <Pencil />;
      }
    } else {
      switch (option) {
        case 'alphabetical':
          return activeSorts[option] === 'asc' ? <ArrowUpAZ /> : <ArrowDownAZ />;
        case 'points':
          return activeSorts[option] === 'asc' ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />;
        case 'unique':
          return activeSorts[option] === 'asc' ? <Star /> : <StarOff />;
        case 'custom':
          return activeSorts[option] === 'asc' ? <Pencil /> : <PencilOff />;
      }
    }
  };

  return (
    <ToggleGroup type="multiple" className="justify-end">
      {(['alphabetical', 'points', 'unique', 'custom'] as SortOption[]).map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          aria-label={`Toggle ${option} sort`}
          data-state={activeSorts[option] ? 'on' : 'off'}
          onClick={() => onToggle(option)}
        >
          {getIcon(option)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}