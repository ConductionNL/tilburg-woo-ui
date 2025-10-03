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
 * @param {string} props.as - HTML element to render as (default: 'span')
 * @param {Object} props.style - CSS styles to apply
 * @param {string} props.className - CSS class name
 * @returns {React.ReactElement}
 */
const ConStandardsResolver = ({
  standardId,
  standards = [],
  as: Component = 'span',
  style,
  className,
  ...props
}) => {
  const resolvedName = useMemo(() => {
    if (!standardId || !Array.isArray(standards) || standards.length === 0) {
      return standardId;
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

      return name;
    }

    // Return the original ID if no match found
    return standardId;
  }, [standardId, standards]);

  return (
    <Component style={style} className={className} {...props}>
      {resolvedName}
    </Component>
  );
};

export default ConStandardsResolver;
