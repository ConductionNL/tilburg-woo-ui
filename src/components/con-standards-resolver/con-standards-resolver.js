/**
 * ConStandardsResolver - A specialized component for resolving standard UUIDs to names
 *
 * This component accepts a pre-fetched standards array and matches the standardId
 * against the identifier property to show the name immediately.
 */

import React, { useMemo } from 'react';

/**
 * Component that resolves standard UUIDs to names using a pre-fetched standards array
 * @param {Object} props
 * @param {string} props.standardId - The UUID of the standard to resolve
 * @param {Array} props.standards - Pre-fetched array of standards from the API
 * @param {boolean} props.returnStandardData - If true, returns the full standard data object instead of just the name
 * @param {string} props.as - HTML element to render as (default: 'span')
 * @param {Object} props.style - CSS styles to apply
 * @param {string} props.className - CSS class name
 * @returns {React.ReactElement|Object}
 */
const ConStandardsResolver = ({
  standardId,
  standards = [],
  returnStandardData = false,
  as: Component = 'span',
  style,
  className,
  ...props
}) => {
  const resolvedData = useMemo(() => {
    if (!standardId || !Array.isArray(standards) || standards.length === 0) {
      return returnStandardData ? { name: standardId, data: null } : standardId;
    }

    // Find the standard with matching identifier (not id)
    const matchingStandard = standards.find((standard) => {
      const standardIdentifier =
        standard?.identifier || standard?.id || standard?.value || standard?.uuid;
      return String(standardIdentifier) === String(standardId);
    });

    if (matchingStandard) {
      // Extract name from the standard data
      const name =
        matchingStandard?.xml?.name?._value ||
        matchingStandard?.naam ||
        matchingStandard?.name ||
        matchingStandard?.title ||
        matchingStandard?.label ||
        standardId;

      return returnStandardData ? { name, data: matchingStandard } : name;
    }

    // Return the original ID if no match found
    return returnStandardData ? { name: standardId, data: null } : standardId;
  }, [standardId, standards, returnStandardData]);

  // If returnStandardData is true, return the data object instead of rendering
  if (returnStandardData) {
    return resolvedData;
  }

  return (
    <Component style={style} className={className} {...props}>
      {resolvedData}
    </Component>
  );
};

export default ConStandardsResolver;
