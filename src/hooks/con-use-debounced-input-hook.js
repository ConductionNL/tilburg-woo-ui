import { useCallback, useRef, useEffect } from 'react';

const useDebouncedInput = (callback, delay = 500) => {
  const timeoutRef = useRef(null);
  const hasValidatedRef = useRef(false);
  const previousValueRef = useRef('');

  const debouncedCallback = useCallback(
    (value) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const isDeleting = value.length < previousValueRef.current.length;
      const isEmpty = !value || value.length === 0;

      // If we've already validated once and user is deleting or emptying the field,
      // trigger validation immediately
      if (hasValidatedRef.current && (isDeleting || isEmpty)) {
        callback(value);
        previousValueRef.current = value;
        return;
      }

      timeoutRef.current = setTimeout(() => {
        callback(value);
        hasValidatedRef.current = true;
        previousValueRef.current = value;
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

export { useDebouncedInput };
