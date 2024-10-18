import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PointsDisplayProps {
    points: number;
    previousPoints: number;
  }
  
  export function PointsDisplay({ points, previousPoints }: PointsDisplayProps) {
    const [displayPoints, setDisplayPoints] = useState(previousPoints);
    const [showDifference, setShowDifference] = useState(false);
    const difference = points - previousPoints;
    const counterRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
      if (points !== previousPoints) {
        setShowDifference(true);
        const duration = 333; // Animation duration in milliseconds
        const startTime = Date.now();

        const animatePoints = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const currentPoints = Math.round(previousPoints + difference * progress);

          setDisplayPoints(currentPoints);

          if (progress < 1) {
            requestAnimationFrame(animatePoints);
          } else {
            setTimeout(() => setShowDifference(false), 333);
          }
        };

        requestAnimationFrame(animatePoints);
      }
    }, [points, previousPoints, difference]);

    useEffect(() => {
      counterRefs.current.forEach((ref, index) => {
        if (ref) {
          const digit = Math.floor(displayPoints / Math.pow(10, 3 - index)) % 10;
          const y = -digit * 10;
          ref.style.transform = `translateY(${y}%)`;
        }
      });
    }, [displayPoints]);

    // Calculate the number of digits to display
    const digitsToShow = displayPoints.toString().length;

    return (
      <div className="relative">
        <div className="text-xl font-bold flex items-center">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-3 h-8 overflow-hidden relative ${index >= 4 - digitsToShow ? '' : 'invisible'}`}
            >
              <div
                ref={(el: HTMLDivElement | null) => {
                  counterRefs.current[index] = el;
                }}
                className="absolute top-0 left-0 transition-transform duration-300 ease-in-out"
                style={{ height: '1000%' }}
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="h-8 flex items-center justify-center">
                    {i}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <span className="ml-1">points</span>
        </div>
        <AnimatePresence>
          {showDifference && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 text-sm ${difference > 0 ? 'text-green-500' : 'text-red-500'} z-50`}
            >
              {difference > 0 ? '+' : ''}{difference}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
