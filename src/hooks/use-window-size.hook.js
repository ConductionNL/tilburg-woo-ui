import { useState, useEffect } from 'react';

let _window_resize_delay = null;

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => {
      if (_window_resize_delay) clearTimeout(_window_resize_delay);
      _window_resize_delay = setTimeout(() => {
        window.requestAnimationFrame(() => {
          setWindowSize(window.innerWidth);
        });
      }, 1000 / 60);
    };

    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      clearTimeout(_window_resize_delay);
      window.removeEventListener('resize', onResize, { passive: true });
    };
  }, []);

  return windowSize;
};

export default useWindowSize;
