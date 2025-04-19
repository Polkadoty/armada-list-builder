import React, { useRef, useState, memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useSpring, animated } from 'react-spring';
import { Squadron } from './FleetBuilder';
import { Plus, Minus, ArrowLeftRight, Trash2, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { OptimizedImage } from './OptimizedImage';

// Add this line at the top of the file
/** @jsxImportSource react */

interface SelectedSquadronProps {
  squadron: Squadron;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSwapSquadron: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function SelectedSquadronComponent({ squadron, onRemove, onIncrement, onDecrement, onSwapSquadron, onMoveUp, onMoveDown, isFirst, isLast }: SelectedSquadronProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const [showImageModal, setShowImageModal] = useState(false);

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
        if (squadron.count === 1) {
          onRemove(squadron.id);
        } else {
          onDecrement(squadron.id);
        }
      } else if (currentX > SWIPE_THRESHOLD) {
        if (squadron.unique) {
          onSwapSquadron(squadron.id);
        } else {
          onIncrement(squadron.id);
        }
      }
    }
    api.start({ x: 0, immediate: false });
    isHorizontalSwipe.current = false;
  };

  const count = squadron.count || 1;
  const totalPoints = squadron.points * count;

  const handleImageTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    // Only open modal if not swiping
    if (isDragging.current) {
      setShowImageModal(true);
    }
  };
  return (
    <div className="relative overflow-hidden mb-4">
      <animated.div
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card>
          <CardContent className="p-0"> {/* Removed padding */}
            <div className="flex items-center">
              <div className="w-2/5 aspect-[3.75/2] relative overflow-hidden group rounded-l-lg"> {/* Adjusted margin */}
                <OptimizedImage 
                  src={squadron.cardimage} 
                  alt={squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
                  width={250}
                  height={350}
                  className="object-cover object-top scale-[103%] rounded-l-lg absolute top-0 left-0" // Added absolute positioning
                  onClick={() => setShowImageModal(true)}
                />
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Only open modal if not swiping
                    if (!isDragging.current) {
                      setShowImageModal(true);
                    }
                  }}
                  onTouchEnd={handleImageTouch}
                >
                  <Eye size={16} className="text-current" />
                </button>
              </div>
              <div className="flex-grow p-2"> {/* Added padding here */}
                <div className="title-font text-xl flex items-center">
                  {squadron.unique && <span className="mr-1 text-yellow-500">●</span>}
                  {count > 1 ? `(${count}) ` : ''}
                  {squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
                  {squadron.unique && (
                    <Button variant="ghost" size="sm" onClick={() => onSwapSquadron(squadron.id)} className="text-blue-500 p-1 ml-1">
                      <ArrowLeftRight size={16} />
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <div className="text-sm sm:text-base">
                      {totalPoints} {!squadron.unique ? 'pts' : 'points'}
                    </div>
                    {!squadron.unique && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => onDecrement(squadron.id)} className="text-red-500 p-1">
                          <Minus size={16} />
                        </Button>
                        <span>{count}</span>
                        <Button variant="ghost" size="sm" onClick={() => onIncrement(squadron.id)} className="text-blue-500 p-1">
                          <Plus size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex flex-row sm:flex-row items-center gap-1 mr-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onMoveUp(squadron.id)} 
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                        disabled={isFirst}
                      >
                        <ChevronLeft className="h-4 w-4 rotate-90 sm:rotate-0" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onMoveDown(squadron.id)} 
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                        disabled={isLast}
                      >
                        <ChevronRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onRemove(squadron.id)} className="text-red-500 p-1">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-12 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          {squadron.unique ? <ArrowLeftRight size={20} className="text-blue-500" /> : <Plus size={20} className="text-blue-500" />}
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          {squadron.count === 1 ? <Trash2 size={20} className="text-red-500" /> : <Minus size={20} className="text-red-500" />}
        </div>
      </animated.div>
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg" onClick={() => setShowImageModal(false)}>
          <div className="relative rounded-lg">
            <OptimizedImage
              src={squadron.cardimage}
              alt={squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
              width={250}
              height={350}
              className="rounded-lg w-[250px] h-[350px] sm:w-[450px] sm:h-[630px] lg:w-[600px] lg:h-[840px] scale-[1.03]"
            />
            <button
              className="absolute top-2 right-2 rounded-full p-1"
              onClick={() => setShowImageModal(false)}
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create a custom comparison function that only triggers re-renders when necessary
function arePropsEqual(prevProps: SelectedSquadronProps, nextProps: SelectedSquadronProps) {
  // Always re-render if the squadron ID changes
  if (prevProps.squadron.id !== nextProps.squadron.id) return false;
  
  // Re-render if the squadron's count changed
  if (prevProps.squadron.count !== nextProps.squadron.count) return false;
  
  // Re-render if the squadron's points changed
  if (prevProps.squadron.points !== nextProps.squadron.points) return false;
  
  // Check position-related props
  if (prevProps.isFirst !== nextProps.isFirst || prevProps.isLast !== nextProps.isLast) return false;
  
  // Props are equal, skip re-render
  return true;
}

// Export the memoized version of the component
export const SelectedSquadron = memo(SelectedSquadronComponent, arePropsEqual);
