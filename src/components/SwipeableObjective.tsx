import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useSpring, animated } from 'react-spring';
import { ObjectiveModel } from './ObjectiveSelector';
import { X, ArrowLeftRight } from 'lucide-react';

interface SwipeableObjectiveProps {
  type: 'assault' | 'defense' | 'navigation';
  selectedObjective: ObjectiveModel | null;
  onRemove: () => void;
  onOpen: () => void;
  color: string;
}

export function SwipeableObjective({ type, selectedObjective, onRemove, onOpen, color }: SwipeableObjectiveProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const isDragging = useRef(false);
  const startX = useRef(0);

  const SWIPE_THRESHOLD = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX.current;
    api.start({ x: deltaX, immediate: true });
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    const currentX = x.get();
    if (currentX < -SWIPE_THRESHOLD) {
      onRemove();
    } else if (currentX > SWIPE_THRESHOLD) {
      onOpen();
    }
    api.start({ x: 0, immediate: false });
  };

  return (
    <div className="relative overflow-hidden">
      <animated.div
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative"
      >
        <Button 
          variant="outline" 
          className={`w-full justify-start hover:bg-[${color}] hover:text-${color === '#FAEE13' ? 'black' : 'white'} transition-colors`}
          onClick={onOpen}
        >
          {selectedObjective ? (
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center">
                <div className={`w-4 h-4 bg-[${color}] mr-2`}></div>
                {selectedObjective.name}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          ) : `ADD ${type.toUpperCase()}`}
        </Button>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-16 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          <ArrowLeftRight size={20} />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-16 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          <X size={20} />
        </div>
      </animated.div>
    </div>
  );
}
