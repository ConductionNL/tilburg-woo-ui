import { useCallback, useRef, useEffect } from 'react';

/**
 * A custom React hook that provides debounced input functionality with smart validation behavior.
 *
 * **Key Features:**
 * - Debounces input changes to reduce excessive callback executions
 * - Smart validation that triggers immediately when users delete content or clear fields (optional)
 * - Automatic cleanup of timeouts to prevent memory leaks
 * - Configurable delay duration for debouncing
 * - Tracks validation state to optimize user experience
 * - Option to disable instant validation on delete/clear for consistent debouncing
 *
 * **Smart Validation Behavior:**
 * The hook implements intelligent validation that adapts to user behavior:
 * - **First Input**: Always debounced by the specified delay
 * - **Subsequent Deletions**: Triggers validation immediately when user is deleting content (if enabled)
 * - **Field Clearing**: Triggers validation immediately when field is emptied (if enabled)
 * - **Typing**: Continues to use debounced validation for new content
 * - **Consistent Mode**: When `disableInstantValidation` is true, all changes are debounced consistently
 *
 * **Use Cases:**
 * - Form field validation with real-time feedback
 * - Search input with API calls
 * - Auto-save functionality
 * - Input filtering and processing
 * - Any scenario requiring delayed processing of user input
 *
 * **Performance Benefits:**
 * - Reduces unnecessary API calls during rapid typing
 * - Provides immediate feedback for destructive actions (deletion/clearing) when enabled
 * - Prevents memory leaks through proper cleanup
 * - Optimizes user experience by balancing responsiveness with performance
 *
 * @example
 * ```jsx
 * import { useDebouncedInput } from './hooks/con-use-debounced-input-hook';
 *
 * const MyComponent = () => {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const [results, setResults] = useState([]);
 *
 *   const handleSearch = useCallback((value) => {
 *     // This will be called with debouncing
 *     fetchSearchResults(value).then(setResults);
 *   }, []);
 *
 *   // Standard debouncing with instant validation on delete
 *   const debouncedSearch = useDebouncedInput(handleSearch, 300);
 *
 *   // Consistent debouncing for all changes (including delete)
 *   const consistentDebouncedSearch = useDebouncedInput(handleSearch, 300, { disableInstantValidation: true });
 *
 *   return (
 *     <input
 *       value={searchTerm}
 *       onChange={(e) => {
 *         setSearchTerm(e.target.value);
 *         debouncedSearch(e.target.value);
 *       }}
 *       placeholder="Search..."
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```jsx
 * // Form validation example
 * const MyForm = () => {
 *   const [email, setEmail] = useState('');
 *   const [validationError, setValidationError] = useState('');
 *
 *   const validateEmail = useCallback((value) => {
 *     if (!value) {
 *       setValidationError('');
 *       return;
 *     }
 *
 *     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *     if (!emailRegex.test(value)) {
 *       setValidationError('Please enter a valid email address');
 *     } else {
 *       setValidationError('');
 *     }
 *   }, []);
 *
 *   const debouncedValidation = useDebouncedInput(validateEmail, 500);
 *
 *   return (
 *     <div>
 *       <input
 *         type="email"
 *         value={email}
 *         onChange={(e) => {
 *           setEmail(e.target.value);
 *           debouncedValidation(e.target.value);
 *         }}
 *       />
 *       {validationError && <span className="error">{validationError}</span>}
 *     </div>
 *   );
 * };
 * ```
 *
 * @param {Function} callback - The function to be called with the debounced value. Receives the current input value as its only parameter.
 * @param {number} [delay=500] - The delay in milliseconds before the callback is executed. Defaults to 500ms.
 * @param {Object} [options={}] - Configuration options for the debounced behavior.
 * @param {boolean} [options.disableInstantValidation=false] - When true, disables instant validation on delete/clear, making all changes consistently debounced.
 *
 * @returns {Function} A debounced callback function that should be called with the input value. This function handles the debouncing logic internally.
 *
 * @note The callback function is called with the current input value as its only parameter.
 * @note The hook automatically cleans up any pending timeouts when the component unmounts.
 * @note The debounced function is memoized using useCallback to prevent unnecessary re-renders.
 * @note Validation triggers immediately for deletions and field clearing after the first validation has occurred (unless disabled).
 * @note The delay parameter should be adjusted based on your use case - shorter delays for responsive feedback, longer delays for performance optimization.
 * @note When `disableInstantValidation` is true, all input changes (including deletions) are debounced consistently.
 *
 * @author [Author Name]
 */
const useDebouncedInput = (callback, delay = 500, options = {}) => {
  const { disableInstantValidation = false } = options;
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

      // If instant validation is disabled, always use debounced behavior
      if (disableInstantValidation) {
        timeoutRef.current = setTimeout(() => {
          callback(value);
          hasValidatedRef.current = true;
          previousValueRef.current = value;
        }, delay);
        return;
      }

      // If we've already validated once and user is deleting or emptying the field,
      // trigger validation immediately (only if instant validation is enabled)
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
    [callback, delay, disableInstantValidation]
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
