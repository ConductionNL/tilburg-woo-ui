import { useEffect, useRef } from 'react';

/**
 * Custom hook that works like useEffect but skips the first render.
 * Useful if you want a fetch to run when pagination changes, separately from the initial fetch.
 * @param {Function} effect - Effect callback function
 * @param {Array} deps - Array of dependencies
 */
const useLaterEffect = (effect, deps) => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return effect();
  }, deps);
};

export { useLaterEffect };
