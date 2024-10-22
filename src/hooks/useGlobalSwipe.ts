import { useState, useEffect } from 'react';

export function useGlobalSwipe() {
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);

  useEffect(() => {
    const preventDefault = (e: Event) => {
      if (isSwipeInProgress) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventDefault);
    };
  }, [isSwipeInProgress]);

  return {
    setIsSwipeInProgress,
  };
}

