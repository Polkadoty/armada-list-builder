import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useSpring, animated } from 'react-spring';
import { ObjectiveModel } from './ObjectiveSelector';
import { X, ArrowLeftRight, Eye } from 'lucide-react';
import { GamemodeRestrictions } from '@/utils/gamemodeRestrictions';
import { ImageModal } from './ImageModal';

interface SwipeableObjectiveProps {
  type: 'assault' | 'defense' | 'navigation' | 'campaign';
  selectedObjective: ObjectiveModel | null;
  selectedObjectives?: ObjectiveModel[];
  onRemove: () => void;
  onOpen: () => void;
  color: string;
  gamemodeRestrictions?: GamemodeRestrictions;
}



export function SwipeableObjective({ type, selectedObjective, selectedObjectives = [], onRemove, onOpen, color, gamemodeRestrictions }: SwipeableObjectiveProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const [showImageModal, setShowImageModal] = React.useState(false);

  const SWIPE_THRESHOLD = 100;
  const ANGLE_THRESHOLD = 30; // Degrees

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.current;
    const deltaY = currentY - startY.current;

    if (!isHorizontalSwipe.current) {
      const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
      isHorizontalSwipe.current = angle < ANGLE_THRESHOLD || angle > (180 - ANGLE_THRESHOLD);
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault();
      api.start({ x: deltaX, immediate: true });
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (isHorizontalSwipe.current) {
      const currentX = x.get();
      if (currentX < -SWIPE_THRESHOLD) {
        onRemove();
      } else if (currentX > SWIPE_THRESHOLD) {
        onOpen();
      }
    }
    api.start({ x: 0, immediate: false });
    isHorizontalSwipe.current = false;
  };

  const isSandbox = selectedObjectives.length > 0;
  const objectives = isSandbox ? selectedObjectives : selectedObjective ? [selectedObjective] : [];
  
  // Check if objective selection is disabled
  const isSelectionDisabled = gamemodeRestrictions?.objectiveRestrictions?.disableSelection;
  
  // Check if objective details should be hidden
  const shouldHideDetails = gamemodeRestrictions?.objectiveRestrictions?.hideDetails;
  
  // Check if this objective type has a forced objective
  const forcedObjectiveName = gamemodeRestrictions?.objectiveRestrictions?.forcedObjectives?.[type];
  const isForcedObjective = !!forcedObjectiveName;
  
  const handleButtonClick = () => {
    if (isSelectionDisabled && !isForcedObjective) return;
    if (isForcedObjective) {
      // For forced objectives, we still want to open the selector to view the objective
      onOpen();
      return;
    }
    onOpen();
  };
  
  return (
    <div className="relative overflow-hidden">
      {objectives.length > 0 ? (
        // Show selected objectives (which may include forced objectives that were properly fetched)
        objectives.map((objective) => (
          <animated.div key={objective.id} style={{ x }} onTouchStart={isSelectionDisabled && !isForcedObjective ? undefined : handleTouchStart} onTouchMove={isSelectionDisabled && !isForcedObjective ? undefined : handleTouchMove} onTouchEnd={isSelectionDisabled && !isForcedObjective ? undefined : handleTouchEnd} className="relative mb-2">
            <Button 
              variant="outline" 
              className={`w-full justify-start transition-colors py-6 text-lg bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-700 backdrop-blur-md ${
                isSelectionDisabled && !isForcedObjective
                  ? 'cursor-not-allowed opacity-50' 
                  : isForcedObjective
                  ? 'hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 cursor-pointer'
                  : 'hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90'
              }`}
              onClick={handleButtonClick}
              style={{ borderColor: color }}
              disabled={isSelectionDisabled && !isForcedObjective}
            >
                              <div className="flex justify-between items-center w-full">
                <div className="flex items-center">
                  <div style={{ width: '16px', height: '16px', backgroundColor: color, marginRight: '8px' }}></div>
                  {shouldHideDetails && !isForcedObjective ? `Chosen ${type.charAt(0).toUpperCase() + type.slice(1)} Objective` : objective.name}
                  {isForcedObjective && <span className="ml-2 text-xs text-gray-500">(Required)</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowImageModal(true); }}
                    className="text-gray-500 hover:text-gray-300 p-1"
                    title="View objective card"
                  >
                    <Eye size={16} />
                  </button>
                  {!isSelectionDisabled && !isForcedObjective && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRemove(); }}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </Button>
          </animated.div>
        ))
      ) : (
        <Button
          onClick={handleButtonClick}
          className={`w-full py-6 bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-700 backdrop-blur-md ${
            isSelectionDisabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90'
          }`}
          variant="outline"
          style={{ borderColor: color }}
          disabled={isSelectionDisabled}
        >
          {isSelectionDisabled 
            ? `${type.charAt(0).toUpperCase() + type.slice(1)} Objective Selection Disabled`
            : `Select ${type.charAt(0).toUpperCase() + type.slice(1)} Objective`
          }
        </Button>
      )}
      <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-16 text-blue-500 bg-zinc-900 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
        <ArrowLeftRight size={20} />
      </div>
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-16 text-red-500 bg-zinc-900 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
        <X size={20} />
      </div>
      {showImageModal && objectives.length > 0 && (
        <ImageModal 
          src={objectives[0].cardimage}
          alt={objectives[0].name}
          onClose={() => setShowImageModal(false)} 
        />
      )}
    </div>
  );
}
