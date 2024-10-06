import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PointsDisplayProps {
    points: number;
    previousPoints: number;
  }
  
  export function PointsDisplay({ points, previousPoints }: PointsDisplayProps) {
    const [displayPoints, setDisplayPoints] = useState(previousPoints);
    const [showDifference, setShowDifference] = useState(false);
    const difference = points - previousPoints;
  
    useEffect(() => {
      if (points !== previousPoints) {
        setShowDifference(true);
        const interval = setInterval(() => {
          setDisplayPoints(prev => {
            const step = Math.sign(difference) * Math.min(Math.abs(difference), 6);
            const next = prev + step;
            if (Math.abs(points - next) < Math.abs(step)) {
              clearInterval(interval);
              setTimeout(() => setShowDifference(false), 1000);
              return points;
            }
            return next;
          });
        }, 50);
        return () => clearInterval(interval);
      }
    }, [points, previousPoints, difference]);
  
    return (
      <div className="relative">
        <div className="text-xl font-bold">{displayPoints} points</div>
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