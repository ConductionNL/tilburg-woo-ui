import { useEffect, useState } from 'react';

/**
 * Custom hook for using a delay (debouncing) on a state change.
 * @param {*} value The value which needs to be 'debounced'.
 * @param {*} delay The amount of ms.
 */
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
