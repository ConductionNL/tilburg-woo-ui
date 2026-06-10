/**
 * Sorts properties based on their order field following these rules:
 * 1. Properties with positive order (1-100) come first, sorted by their order value
 * 2. Properties with order=0 come next, maintaining their original insertion order
 * 3. Properties with null/undefined order come last, maintaining their original insertion order
 *
 * @param {Object} properties - Object containing property definitions with optional order field
 * @returns {Object} New object with properties sorted according to the rules
 */
export const sortPropertiesByOrder = (properties) => {
  if (!properties) return {};

  return Object.entries(properties)
    .sort(([, defA], [, defB]) => {
      const orderA = defA.order;
      const orderB = defB.order;

      const hasPositiveA = typeof orderA === 'number' && orderA > 0;
      const hasPositiveB = typeof orderB === 'number' && orderB > 0;

      // 1) Both have positive orders: sort by numeric value (smallest first)
      if (hasPositiveA && hasPositiveB) {
        return orderA - orderB;
      }

      // 2) Exactly one has a positive order: that one comes first
      if (hasPositiveA && !hasPositiveB) {
        return -1; // A comes before B
      }
      if (hasPositiveB && !hasPositiveA) {
        return 1; // B comes before A
      }

      // 3) Neither has a positive order: now check if one is exactly 0
      const isZeroA = orderA === 0;
      const isZeroB = orderB === 0;

      // 3a) If one is zero and the other is null/undefined => zero comes first
      if (isZeroA && !isZeroB) {
        return -1; // A (order=0) comes before B (null/undefined)
      }
      if (isZeroB && !isZeroA) {
        return 1; // B (order=0) comes before A (null/undefined)
      }

      // 4) At this point, preserve original insertion order
      return 0;
    })
    .reduce((acc, [key, def]) => {
      acc[key] = def;
      return acc;
    }, {});
};
