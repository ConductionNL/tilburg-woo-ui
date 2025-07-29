// eslint-disable-next-line import/no-unresolved
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useDebouncedInput } from '@src/hooks/index';
import ReactSelect from 'react-select';
import { VISUALS } from '@src/constants';
import { AcFlex } from '@atoms';
import { AcFormField } from '@molecules';

/**
 * A sophisticated table search component that provides an intuitive search interface
 * with dropdown field selection, text input, and search tags with removal functionality.
 *
 * **Key Features:**
 * - Dropdown to select which field to search on (from dataProperties)
 * - Text input for search query with debounced updates
 * - Visual tags showing active searches with removal capability
 * - Automatic enum support for dropdown fields
 * - Maintains search state and provides clean callback interface
 * - Responsive design with proper accessibility
 * - Automatic state reset when dataProperties change (e.g., when switching object types)
 *
 * **Search Flow:**
 * 1. User selects a field from dropdown (defaults to first available field)
 * 2. User types search query in text input
 * 3. Search is debounced and triggers callback
 * 4. Active searches are displayed as removable tags
 * 5. User can remove individual searches or clear all
 *
 * **Enum Support:**
 * - If a field has enum values in dataProperties, the text input becomes a dropdown
 * - Enum dropdowns are searchable and clearable
 * - Maintains same debounced behavior as text inputs
 *
 * **Label Formatting:**
 * - Uses `title` property from dataProperties if available
 * - Otherwise formats the key: camelCase -> "Camel Case", underscores -> spaces, dashes -> spaces
 *
 * **State Reset:**
 * - When available fields change (e.g., switching object types), all internal state is automatically reset
 * - This prevents stale search parameters from being applied to new object types
 * - The component uses a key based on available fields to detect actual changes, not just object reference changes
 *
 * @example
 * ```jsx
 * <ConTableSearch
 *   dataProperties={{
 *     name: { type: "string", title: "Full Name" },
 *     emailAddress: { type: "string" }, // Will display as "Email Address"
 *     user_status: { type: "string", enum: ["active", "inactive"] } // Will display as "User Status"
 *   }}
 *   onSearch={(searchParams) => {
 *     // searchParams: { name: "John", emailAddress: "john@example.com" }
 *     fetchData(searchParams);
 *   }}
 * />
 * ```
 *
 * @param {object} props - Component props
 * @param {boolean} [props.show=false] - Whether to show the search component
 * @param {Object} props.dataProperties - Schema properties object containing field definitions with enum values
 * @param {(searchParams: { [key: string]: string }) => void} props.onSearch - Callback function called when search parameters change
 * @param {number} [props.debounceDelay=500] - Debounce delay in milliseconds for search input
 * @param {string} [props.placeholder="Zoeken..."] - Placeholder text for search input
 * @param {string} [props.dropdownPlaceholder="Selecteer veld"] - Placeholder text for field dropdown
 *
 * @returns {React.ReactElement} The rendered search component
 *
 * @author [Your Name]
 */
const ConTableSearch = ({
  show = false,
  dataProperties = {},
  onSearch,
  debounceDelay = 500,
  placeholder = 'Zoeken...',
  dropdownPlaceholder = 'Selecteer veld',
}) => {
  const [selectedField, setSelectedField] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearches, setActiveSearches] = useState({});

  // Format field key to display label
  const formatFieldLabel = useCallback((key) => {
    // Replace underscores and dashes with spaces
    let formatted = key.replace(/[_-]/g, ' ');

    // Handle camelCase by adding spaces before capital letters
    formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Capitalize first letter of each word
    formatted = formatted.replace(/\b\w/g, (char) => char.toUpperCase());

    return formatted;
  }, []);

  // Get available fields from dataProperties
  const availableFields = useMemo(() => {
    return Object.keys(dataProperties).map((key) => ({
      value: key,
      key: key,
      label: dataProperties[key].title || formatFieldLabel(key),
    }));
  }, [dataProperties, formatFieldLabel]);

  // Create a stable key based on available fields to detect actual changes
  // This prevents unnecessary resets when dataProperties object reference changes but content stays the same
  const fieldsKey = useMemo(() => {
    return availableFields
      .map((field) => field.key)
      .sort()
      .join(',');
  }, [availableFields]);

  // Clear active searches when available fields change (e.g., switching object types)
  useEffect(() => {
    // Always reset when fields change, regardless of active searches
    setActiveSearches({});
    setSearchQuery('');
    setSelectedField(null);
    // Don't call onSearch here as it would trigger unnecessary API calls
    // The parent component will handle data fetching when switching object types
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldsKey]);

  // Set default selected field to first available field
  useEffect(() => {
    if (availableFields.length > 0 && !selectedField) {
      setSelectedField(availableFields[0]);
    }
  }, [availableFields, selectedField]);

  // Create dropdown options from available fields
  const fieldOptions = useMemo(() => {
    return availableFields;
  }, [availableFields]);

  // Check if current field has enum values
  const currentFieldSchema = useMemo(() => {
    if (!selectedField) return null;
    return dataProperties[selectedField.key];
  }, [selectedField, dataProperties]);

  const isEnumField = useMemo(() => {
    return currentFieldSchema?.enum && Array.isArray(currentFieldSchema.enum);
  }, [currentFieldSchema]);

  const enumOptions = useMemo(() => {
    if (!isEnumField) return [];
    return currentFieldSchema.enum.map((option) => ({
      value: option,
      label: option,
    }));
  }, [isEnumField, currentFieldSchema]);

  // Debounced search callback
  const debouncedSearch = useDebouncedInput(
    useCallback(
      (query) => {
        if (!selectedField || !query.trim()) {
          // Remove this field from active searches
          const newSearches = { ...activeSearches };
          delete newSearches[selectedField.key];
          setActiveSearches(newSearches);

          if (typeof onSearch === 'function') {
            onSearch(newSearches);
          }
          return;
        }

        // Add or update search for this field
        const newSearches = {
          ...activeSearches,
          [selectedField.key]: query.trim(),
        };
        setActiveSearches(newSearches);

        if (typeof onSearch === 'function') {
          onSearch(newSearches);
        }
      },
      [selectedField, activeSearches, onSearch]
    ),
    debounceDelay,
    { disableInstantValidation: true }
  );

  // Handle field selection change
  const handleFieldChange = useCallback((option) => {
    setSelectedField(option);
    setSearchQuery(''); // Clear search query when field changes
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback(
    (value) => {
      setSearchQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Handle enum selection change
  const handleEnumChange = useCallback(
    (option) => {
      const value = option?.value || '';
      setSearchQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Remove a specific search tag
  const handleRemoveSearch = useCallback(
    (fieldKey) => {
      const newSearches = { ...activeSearches };
      delete newSearches[fieldKey];
      setActiveSearches(newSearches);

      // Clear the search query if we're removing the currently selected field
      if (selectedField && selectedField.key === fieldKey) {
        setSearchQuery('');
      }

      if (typeof onSearch === 'function') {
        onSearch(newSearches);
      }
    },
    [activeSearches, onSearch, selectedField]
  );

  // Clear all searches
  const handleClearAll = useCallback(() => {
    setActiveSearches({});
    setSearchQuery('');

    if (typeof onSearch === 'function') {
      onSearch({});
    }
  }, [onSearch]);

  // Get display label for a field key
  const getFieldLabel = useCallback(
    (fieldKey) => {
      const field = availableFields.find((f) => f.key === fieldKey);
      return field?.label || fieldKey;
    },
    [availableFields]
  );

  // If no available fields, don't render anything
  if (availableFields.length === 0) {
    return null;
  }

  if (!show) {
    return null;
  }

  return (
    <div className='con-table-search' key={fieldsKey}>
      <AcFlex spacing='sm' alignItems='center' wrap>
        {/* Field Dropdown */}
        <div className='con-table-search__field-select'>
          <ReactSelect
            key={fieldsKey}
            value={selectedField}
            onChange={handleFieldChange}
            options={fieldOptions}
            placeholder={dropdownPlaceholder}
            isClearable={false}
            isSearchable={false}
            className='con-table-search__dropdown'
            classNamePrefix='con-table-search'
          />
        </div>

        {/* Search Input */}
        <div className='con-table-search__input-container'>
          {isEnumField ? (
            <ReactSelect
              value={searchQuery ? { value: searchQuery, label: searchQuery } : null}
              onChange={handleEnumChange}
              options={enumOptions}
              placeholder={placeholder}
              isClearable
              isSearchable
              className='con-table-search__enum-select'
              classNamePrefix='con-table-search'
            />
          ) : (
            <AcFormField
              id='table-search-input'
              label=''
              type='text'
              inputType='text'
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={placeholder}
              fullWidth
            />
          )}
        </div>

        {/* Search Tags */}
        {Object.keys(activeSearches).length > 0 && (
          <AcFlex spacing='xs' alignItems='center' wrap>
            {Object.entries(activeSearches).map(([fieldKey, query]) => (
              <div key={fieldKey} className='con-table-search__tag'>
                <span className='con-table-search__tag-label'>
                  {getFieldLabel(fieldKey)}: {query}
                </span>
                <button
                  type='button'
                  onClick={() => handleRemoveSearch(fieldKey)}
                  className='con-table-search__tag-remove'
                  aria-label={`Verwijder zoeken op ${getFieldLabel(fieldKey)}`}
                >
                  <VISUALS.CLOSE />
                </button>
              </div>
            ))}

            {/* Clear All Button */}
            <button
              type='button'
              onClick={handleClearAll}
              className='con-table-search__clear-all'
              aria-label='Verwijder alle zoekopdrachten'
            >
              <VISUALS.CLOSE />
              <span>Alles wissen</span>
            </button>
          </AcFlex>
        )}
      </AcFlex>
    </div>
  );
};

export default ConTableSearch;
