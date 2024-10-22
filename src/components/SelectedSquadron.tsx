import React, { useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { useSpring, animated } from 'react-spring';
import { Squadron } from './FleetBuilder';
import { Plus, Minus, ArrowLeftRight, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

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

  return (
    <div className="relative overflow-hidden mb-2">
      <animated.div
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card>
          <CardContent className="flex items-center p-2">
            <div className="w-16 aspect-[3.75/2] mr-4 relative overflow-hidden">
              <Image 
                src={squadron.cardimage} 
                alt={squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
                layout="fill"
                objectFit="cover"
                objectPosition="top"
                className="scale-[100%]"
              />
            </div>
            <div className="flex-grow">
              <span className="font-bold flex items-center">
                {squadron.unique && (
                  <span className="mr-1 text-yellow-500">●</span>
                )}
                {count > 1 ? `(${count}) ` : ''}
                {squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span>{totalPoints} points</span>
                  {squadron.unique ? (
                    <Button variant="ghost" size="sm" onClick={() => onSwapSquadron(squadron.id)} className="text-blue-500 p-1">
                      <ArrowLeftRight size={16} />
                    </Button>
                  ) : (
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
          </CardContent>
        </Card>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-12 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          {squadron.unique ? <ArrowLeftRight size={20} /> : <Plus size={20} />}
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          {squadron.count === 1 ? <Trash2 size={20} /> : <Minus size={20} />}
        </div>
      </animated.div>
    </div>
  );
}
