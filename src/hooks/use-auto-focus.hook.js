import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that focuses an element when it is mounted.
 */
export const useAutoFocus = () => {
  const elementRef = useRef(null);
  const location = useLocation(); // Get the current location

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.focus();
    }
  }, [location]); // Depend on location change

  return elementRef;
};
