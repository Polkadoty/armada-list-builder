import React, { useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { useSpring, animated } from 'react-spring';
import { Squadron } from './FleetBuilder';
import { Plus, Minus, ArrowLeftRight, Trash2 } from 'lucide-react';

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
    api.start({ x: 0, immediate: false });
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
                alt={squadron.name}
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
                {count > 1 ? `(${count}) ` : ''}{squadron.name}
              </span>
              <div className="flex items-center">
                <span className="mr-2">{totalPoints} points</span>
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
