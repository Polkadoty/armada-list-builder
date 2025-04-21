import React, { useState, useEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';

interface PointsDisplayProps {
    points: number;
    previousPoints: number;
    pointsLimit?: number;
    showWarning?: boolean;
}
  
export function PointsDisplay({ points, previousPoints, pointsLimit, showWarning }: PointsDisplayProps) {
    const [displayPoints, setDisplayPoints] = useState(previousPoints);
    const counterRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [isIncreasing, setIsIncreasing] = useState(false);
    const [isDecreasing, setIsDecreasing] = useState(false);

    useEffect(() => {
      if (points !== previousPoints) {
        const duration = 333; // Animation duration in milliseconds
        const startTime = Date.now();

        setIsIncreasing(points > previousPoints);
        setIsDecreasing(points < previousPoints);

        const animatePoints = () => {
          const elapsedTime = Date.now() - startTime;
          const progress = Math.min(elapsedTime / duration, 1);
          const currentPoints = Math.round(previousPoints + (points - previousPoints) * progress);

          setDisplayPoints(currentPoints);

          if (progress < 1) {
            requestAnimationFrame(animatePoints);
          } else {
            setIsIncreasing(false);
            setIsDecreasing(false);
          }
        };

        requestAnimationFrame(animatePoints);
      }
    }, [points, previousPoints]);

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
    const overLimit = pointsLimit !== undefined && points > pointsLimit;

    return (
      <div className="relative">
        <div className={`text-xl font-bold flex items-center ${overLimit || showWarning ? 'text-yellow-500' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-3 h-8 overflow-hidden relative ${index >= 4 - digitsToShow ? '' : 'invisible'}`}
            >
              <div
                ref={(el: HTMLDivElement | null) => {
                  counterRefs.current[index] = el;
                }}
                className={`absolute top-0 left-0 transition-transform duration-200 ease-in-out ${
                  isIncreasing ? 'text-green-500' : isDecreasing ? 'text-red-500' : ''
                }`}
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
          {(overLimit || showWarning) && (
            <TriangleAlert className="ml-1 h-5 w-5 text-yellow-500 animate-pulse" />
          )}
        </div>
        {overLimit && pointsLimit !== undefined && (
          <div className="text-xs text-yellow-600 font-semibold mt-1">Limit: {pointsLimit}</div>
        )}
      </div>
    );
  }
