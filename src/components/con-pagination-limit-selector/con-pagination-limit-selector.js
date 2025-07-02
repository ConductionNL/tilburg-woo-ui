import React, { useState, useEffect, useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { AcGetState, AcSaveState } from '@src/utilities';
import clsx from 'clsx';

/**
 * Renders a react-select CreateSelect component with the options 10, 20, 50, 100, 200, 500
 * Given its a CreateSelect you can create your own value for the limit
 * Any custom values are stored indefinitely in the current session
 * Selected limit option is stored per objectType (e.g. 'applicaties', 'diensten') in the current session, so that different objects have different limits
 */
const ConPaginationLimitSelector = ({
  objectType,
  value,
  onChange,
  placeholder = 'Selecteer aantal items per pagina',
  className,
}) => {
  // Default options for pagination limits
  const defaultOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '200', value: 200 },
    { label: '500', value: 500 },
  ];

  // Get custom options from session storage
  const [customOptions, setCustomOptions] = useState([]);

  // Get stored limit for this objectType
  const [selectedLimit, setSelectedLimit] = useState(value || 20);

  // Load custom options and selected limit from session storage on component mount
  useEffect(() => {
    // Load custom options (stored indefinitely in session)
    const storedCustomOptions = AcGetState('pagination_limit_custom_options') || [];
    setCustomOptions(storedCustomOptions);

    // Load selected limit for this specific objectType
    const storedLimit = AcGetState(`pagination_limit_${objectType}`);
    if (storedLimit) {
      setSelectedLimit(storedLimit);
      // Only call onChange if we have a stored value that's different from the current value
      if (onChange && storedLimit !== value) {
        onChange?.(storedLimit);
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

export default ConPaginationLimitSelector;
