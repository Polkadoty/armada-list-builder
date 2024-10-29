import React, { useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useSpring, animated } from 'react-spring';
import { Squadron } from './FleetBuilder';
import { Plus, Minus, ArrowLeftRight, Trash2, Eye, X } from 'lucide-react';
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
}

export function SelectedSquadron({ squadron, onRemove, onIncrement, onDecrement, onSwapSquadron }: SelectedSquadronProps) {
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
          <CardContent className="p-2">
            <div className="flex items-center">
              <div className="w-32 aspect-[3.75/2] mr-4 relative overflow-hidden group">
                <OptimizedImage 
                  src={squadron.cardimage} 
                  alt={squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
                  width={250}
                  height={350}
                  className="object-cover object-top scale-[103%]"
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
                  <Eye size={16} className="text-white cursor-pointer" />
                </button>
              </div>
              <div className="flex-grow">
                <div className="font-bold text-base sm:text-lg flex items-center">
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
                    <div className="text-sm sm:text-base">{totalPoints} points</div>
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
                  <Button variant="ghost" size="sm" onClick={() => onRemove(squadron.id)} className="text-red-500 p-1">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-12 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          {squadron.unique ? <ArrowLeftRight size={20} /> : <Plus size={20} />}
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          {squadron.count === 1 ? <Trash2 size={20} /> : <Minus size={20} />}
        </div>
      </animated.div>
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative">
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
