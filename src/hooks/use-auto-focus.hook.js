import { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that focuses an element when it is mounted.
 * Updated to only trigger on changes to the pathname, ignoring query parameters.
 */
export const useAutoFocus = () => {
  const elementRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.focus();
    }
  }, [location.pathname]);

  return elementRef;
};
