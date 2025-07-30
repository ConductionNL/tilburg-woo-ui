// eslint-disable-next-line import/no-unresolved
import React, { useState, useEffect, useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { AcGetState, AcSaveState } from '@src/utilities';
import clsx from 'clsx';

/**
 * Renders a react-select CreateSelect component with the options 10, 20, 50, 100, 200, 500
 * Given its a CreateSelect you can create your own value for the limit
 * Any custom values are stored indefinitely in the current session
 * Selected limit option is stored per objectType (e.g. 'applicaties', 'diensten') in the current session, so that different objects have different limits
 *
 * @param {Object} props - Component props
 * @param {string} props.objectType - The type of object (e.g., 'organisaties', 'applicaties', 'diensten')
 * @param {number} props.value - The current limit value (controlled component)
 * @param {function} props.onChange - Callback function called when limit changes
 * @param {function} [props.onReady] - Callback function called when component is initialized
 * @param {string} [props.placeholder] - Placeholder text for the select input
 * @param {string} [props.className] - Additional CSS class names
 *
 * @example
 * // Basic usage with controlled state
 * const [limit, setLimit] = useState(20);
 *
 * <ConPaginationLimitSelector
 *   objectType="organisaties"
 *   value={limit}
 *   onChange={setLimit}
 * />
 *
 * @example
 * // With onReady callback (legacy approach - use usePaginationLimit hook instead)
 * const [isInitialized, setIsInitialized] = useState(false);
 * const [pagination, setPagination] = useState({ limit: 20 });
 *
 * <ConPaginationLimitSelector
 *   objectType="organisaties"
 *   value={pagination.limit}
 *   onChange={(limit) => setPagination(prev => ({ ...prev, limit }))}
 *   onReady={(savedLimit) => {
 *     if (savedLimit && savedLimit !== pagination.limit) {
 *       setPagination(prev => ({ ...prev, limit: savedLimit }));
 *     }
 *     setIsInitialized(true);
 *   }}
 * />
 *
 * @example
 * // Recommended approach using the usePaginationLimit hook
 * const [limit, setLimit] = usePaginationLimit('organisaties', 20);
 *
 * <ConPaginationLimitSelector
 *   objectType="organisaties"
 *   value={limit}
 *   onChange={setLimit}
 * />
 */
const ConPaginationLimitSelector = ({
  objectType,
  value,
  onChange,
  onReady,
  placeholder = 'Selecteer aantal items per pagina',
  className,
}) => {
  // Default options for pagination limits
  const defaultOptions = useMemo(
    () => [
      { label: '10', value: 10 },
      { label: '20', value: 20 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
      { label: '200', value: 200 },
      { label: '500', value: 500 },
    ],
    []
  );

  // Get custom options from session storage
  const [customOptions, setCustomOptions] = useState([]);

  // Load saved limit synchronously to prevent race conditions
  const savedLimit = AcGetState(`pagination_limit_${objectType}`);
  const initialLimit = savedLimit || value || 20;

  // Get stored limit for this objectType
  const [selectedLimit, setSelectedLimit] = useState(initialLimit);

  // Load custom options from session storage on component mount
  useEffect(() => {
    // Load custom options (stored indefinitely in session)
    const storedCustomOptions = AcGetState('pagination_limit_custom_options') || [];
    setCustomOptions(storedCustomOptions);

    // Notify parent when component is ready
    if (onReady) {
      // If we have a saved limit that's different from the provided value, pass it to parent
      if (savedLimit && savedLimit !== value) {
        onReady(savedLimit);
      } else {
        // Otherwise just notify that we're ready
        onReady();
      }
    }
  }, []);

  // Update selectedLimit when value prop changes (controlled component behavior)
  useEffect(() => {
    if (value !== undefined && value !== selectedLimit) {
      setSelectedLimit(value);
    }
  }, [value, selectedLimit]);

  // Combine default and custom options
  const allOptions = useMemo(() => {
    const combinedOptions = [...defaultOptions, ...customOptions];
    // Sort by numeric value to ensure proper ordering
    return combinedOptions.sort((a, b) => a.value - b.value);
  }, [defaultOptions, customOptions]);

  // Handle creating a new custom option
  const handleCreateOption = (inputValue) => {
    const numericValue = parseInt(inputValue, 10);

    // Validate that the input is a positive number
    if (isNaN(numericValue) || numericValue <= 0) {
      return;
    }

    const newOption = {
      label: inputValue,
      value: numericValue,
    };

    // Check if option already exists
    const optionExists = allOptions.some((option) => option.value === numericValue);
    if (optionExists) {
      return;
    }

    // Add to custom options
    const updatedCustomOptions = [...customOptions, newOption];
    setCustomOptions(updatedCustomOptions);

    // Store custom options in session storage
    AcSaveState('pagination_limit_custom_options', updatedCustomOptions);

    // Store selected limit for this objectType in session storage
    AcSaveState(`pagination_limit_${objectType}`, numericValue);

    // Set as selected value
    setSelectedLimit(numericValue);
    onChange?.(numericValue);
  };

  // Handle option selection
  const handleChange = (selectedOption) => {
    if (selectedOption) {
      const limitValue = selectedOption.value;
      setSelectedLimit(limitValue);

      // Store selected limit for this objectType in session storage
      AcSaveState(`pagination_limit_${objectType}`, limitValue);

      // Call parent onChange
      onChange?.(limitValue);
    }
  };

  // Validate new option input
  const isValidNewOption = (inputValue) => {
    const numericValue = parseInt(inputValue, 10);
    return (
      !isNaN(numericValue) &&
      numericValue > 0 &&
      !allOptions.some((option) => option.value === numericValue)
    );
  };

  // Find the currently selected option
  const selectedOption = useMemo(() => {
    return allOptions.find((option) => option.value === selectedLimit) || null;
  }, [allOptions, selectedLimit]);

  return (
    <CreatableSelect
      placeholder={placeholder}
      value={selectedOption}
      onChange={handleChange}
      onCreateOption={handleCreateOption}
      options={allOptions}
      isValidNewOption={isValidNewOption}
      className={clsx(className, 'con-pagination-limit-selector')}
      isClearable={false}
      isSearchable={true}
      formatCreateLabel={(inputValue) => `Aanmaken: ${inputValue}`}
      noOptionsMessage={() => 'Geen opties beschikbaar'}
      loadingMessage={() => 'Laden...'}
    />
  );
};

/**
 * Custom hook for managing pagination limits with session storage persistence.
 *
 * This hook handles loading and saving pagination limits to session storage,
 * preventing race conditions by loading the saved limit synchronously during initialization.
 *
 * @param {string} objectType - The type of object (e.g., 'organisaties', 'applicaties', 'diensten')
 * @param {number} defaultValue - The default limit to use if no saved limit exists (default: 20)
 * @returns {[number, function]} A tuple containing the current limit and a function to update it
 *
 * @example
 * // Basic usage
 * const [limit, setLimit] = usePaginationLimit('organisaties', 20);
 *
 * @example
 * // With pagination state
 * const [limit, setLimit] = usePaginationLimit('organisaties');
 * const [pagination, setPagination] = useState({
 *   total: 0,
 *   page: 1,
 *   pages: 0,
 *   limit,
 *   offset: 0,
 * });
 *
 * // Update pagination when limit changes
 * useEffect(() => {
 *   setPagination(prev => ({ ...prev, limit }));
 * }, [limit]);
 */
export const usePaginationLimit = (objectType, defaultValue = 20) => {
  const [changeKey, setChangeKey] = useState(0);

  const limit = useMemo(
    () => AcGetState(`pagination_limit_${objectType}`) || defaultValue,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objectType, defaultValue, changeKey]
  );

  const updateLimit = (newLimit) => {
    AcSaveState(`pagination_limit_${objectType}`, newLimit);
    setChangeKey((prev) => prev + 1);
  };

  return [limit, updateLimit];
};

export default ConPaginationLimitSelector;
