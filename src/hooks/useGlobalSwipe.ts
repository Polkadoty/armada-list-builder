import { useState, useEffect, useRef } from 'react';

export function useGlobalSwipe() {
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const initialX = useRef<number | null>(null);
  const initialY = useRef<number | null>(null);

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isSwipeInProgress && initialX.current !== null && initialY.current !== null) {
        const deltaX = e.touches[0].clientX - initialX.current;
        const deltaY = e.touches[0].clientY - initialY.current;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          e.preventDefault();
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      initialX.current = e.touches[0].clientX;
      initialY.current = e.touches[0].clientY;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [isSwipeInProgress]);

  return {
    setIsSwipeInProgress,
  };
}
