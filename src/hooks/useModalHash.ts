// src/hooks/useModalHash.ts
import { useEffect } from 'react';

export function useModalHash(isOpen: boolean, modalId: string, onClose: () => void) {
  useEffect(() => {
    if (isOpen) {
      // Add hash when modal opens
      window.location.hash = modalId;
      
      // Handle back button/gesture
      const handleHashChange = () => {
        if (window.location.hash !== `#${modalId}`) {
          onClose();
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
        // Clean up hash if component unmounts while modal is open
        if (window.location.hash === `#${modalId}`) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      };
    } else {
      // Remove hash when modal closes
      if (window.location.hash === `#${modalId}`) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [isOpen, modalId, onClose]);
}