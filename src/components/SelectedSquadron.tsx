import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { useSpring, animated } from 'react-spring';
import { Squadron } from './FleetBuilder';

interface SelectedSquadronProps {
  squadron: Squadron;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSwapSquadron: (id: string) => void;
}

export function SelectedSquadron({ squadron, onRemove, onIncrement, onDecrement, onSwapSquadron }: SelectedSquadronProps) {
  const [showPointChange, setShowPointChange] = useState(false);
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const isDragging = useRef(false);
  const startX = useRef(0);

  const count = squadron.count || 1;
  const totalPoints = squadron.points * count;

  const SWIPE_THRESHOLD = 50;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - startX.current;
      api.start({ x: deltaX, immediate: true });
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      const currentX = x.get();
      if (currentX < -SWIPE_THRESHOLD) {
        if (squadron.unique) {
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

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [api, squadron, onRemove, onDecrement, onSwapSquadron, onIncrement, x]);

  return (
    <div className="mb-2 overflow-hidden relative">
      <animated.div style={{ x }} className="relative">
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
                {squadron.unique ? (
                  <button onClick={(e) => { e.stopPropagation(); onRemove(squadron.id); }} className="text-red-500 hover:text-red-700">
                    ✕
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (squadron.count === 1) {
                          onRemove(squadron.id);
                        } else {
                          onDecrement(squadron.id);
                        }
                      }}
                      onMouseEnter={() => setShowPointChange(true)}
                      onMouseLeave={() => setShowPointChange(false)}
                      className="text-blue-500 hover:text-blue-700 mr-2 relative"
                    >
                      -
                      {showPointChange && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1">
                          -{squadron.points}
                        </span>
                      )}
                    </button>
                    <span className="mr-2">{squadron.count}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onIncrement(squadron.id); }}
                      onMouseEnter={() => setShowPointChange(true)}
                      onMouseLeave={() => setShowPointChange(false)}
                      className="text-green-500 hover:text-green-700 mr-2 relative"
                    >
                      +
                      {showPointChange && (
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1">
                          +{squadron.points}
                        </span>
                      )}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onRemove(squadron.id); }} className="text-red-500 hover:text-red-700">
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </animated.div>
      <animated.div
        style={{
          position: 'absolute',
          right: '100%',
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          paddingRight: '1rem',
          opacity: x.to(value => value > 0 ? Math.min(value / SWIPE_THRESHOLD, 1) : 0),
        }}
      >
        {squadron.unique ? (
          <span className="text-blue-500">Swap</span>
        ) : (
          <span className="text-green-500">Add</span>
        )}
      </animated.div>
      <animated.div
        style={{
          position: 'absolute',
          left: '100%',
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '1rem',
          opacity: x.to(value => value < 0 ? Math.min(-value / SWIPE_THRESHOLD, 1) : 0),
        }}
      >
        {squadron.unique ? (
          <span className="text-red-500">Remove</span>
        ) : (
          <span className="text-blue-500">Decrease</span>
        )}
      </animated.div>
    </div>
  );
}
