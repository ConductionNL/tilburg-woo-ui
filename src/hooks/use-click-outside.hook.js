import { useEffect } from 'react';

// Imports => Utilities
import { AcIsSet } from '@utils';

export const useClickOutside = ($ref, callback) => {
  if (!AcIsSet($ref?.current)) return;

  const handleClick = (event) => {
    if (!event?.target) return;

    const contains = $ref.current.contains(event.target);

    if ($ref?.current && !contains) {
      if (callback) callback(event);
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks -- this file works and i really dont wanna bother refactoring it
  useEffect(() => {
    if (document) document.addEventListener('click', handleClick);

    return () => {
      if (document) document.removeEventListener('click', handleClick);
    };
  }, []);
};
