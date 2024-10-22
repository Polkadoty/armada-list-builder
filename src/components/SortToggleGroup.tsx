import React from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowUpAZ, ArrowDownAZ, ArrowUpNarrowWide, ArrowDownWideNarrow, FlaskRound, MoveUp, MoveDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type SortOption = 'alphabetical' | 'points' | 'unique' | 'custom';

interface SortToggleGroupProps {
  activeSorts: Record<SortOption, 'asc' | 'desc' | null>;
  onToggle: (option: SortOption) => void;
}

export function SortToggleGroup({ activeSorts, onToggle }: SortToggleGroupProps) {
  const getIcon = (option: SortOption) => {
    const iconStyle = "flex items-center justify-center w-full h-full relative";
    const arrowStyle = "absolute right-[-8px]";
    if (activeSorts[option] === null) {
      switch (option) {
        case 'alphabetical':
          return <ArrowUpAZ />;
        case 'points':
          return <ArrowUpNarrowWide />;
        case 'unique':
          return (
            <div className={iconStyle}>
              <span className="text-yellow-500 text-xs sm:text-sm">●</span>
            </div>
          );
        case 'custom':
          return <FlaskRound />;
      }
    } else {
      switch (option) {
        case 'alphabetical':
          return activeSorts[option] === 'asc' ? <ArrowUpAZ /> : <ArrowDownAZ />;
        case 'points':
          return activeSorts[option] === 'asc' ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />;
        case 'unique':
          return (
            <div className={iconStyle}>
              <span className="text-yellow-500 text-xs sm:text-sm">●</span>
              {activeSorts[option] === 'asc' ? <MoveUp className={arrowStyle} size={12} /> : <MoveDown className={arrowStyle} size={12} />}
            </div>
          );
        case 'custom':
          return (
            <div className={iconStyle}>
              <FlaskRound size={16} />
              {activeSorts[option] === 'asc' ? <MoveUp className={arrowStyle} size={12} /> : <MoveDown className={arrowStyle} size={12} />}
            </div>
          );
      }
    }
  };

  const getSortTooltip = (option: SortOption) => {
    switch (option) {
      case 'alphabetical':
        return 'Sort alphabetically';
      case 'points':
        return 'Sort by points';
      case 'unique':
        return 'Sort by unique status';
      case 'custom':
        return 'Custom sort';
    }
  };

  return (
    <ToggleGroup type="multiple" className="justify-end" style={{ width: 'fit-content' }}>
      {(['alphabetical', 'points', 'unique', 'custom'] as SortOption[]).map((option) => (
        <Tooltip key={option}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value={option}
              aria-label={`Toggle ${option} sort`}
              data-state={activeSorts[option] ? 'up' : 'down'}
              onClick={() => onToggle(option)}
              className={`w-10 h-10 ${activeSorts[option] !== null ? 'bg-gray-500' : 'bg-transparent'}`}
            >
              {getIcon(option)}
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getSortTooltip(option)}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
