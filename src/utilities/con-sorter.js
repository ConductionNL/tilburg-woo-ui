/**
 * Sorts data based on a specified key and direction
 * 
 * @param {Array} data - The array of objects to sort
 * @param {string} sortKey - The key to sort by
 * @param {boolean|null} sortDirection - The direction to sort (true = ascending, false = descending, null = no sort)
 * @returns {Array} The sorted array
 */
const ConSorter = (data, sortKey, sortDirection) => {
  // If no sort key or direction is null, return original data
  if (!sortKey || sortDirection === null) {
    return data;
  }

  // avoid mutating the original data
  const copyData = [...data];

  return copyData.sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    // Handle null/undefined values and empty strings
    if (aVal == null || aVal === '') return sortDirection ? 1 : -1;
    if (bVal == null || bVal === '') return sortDirection ? -1 : 1;

    // Handle different types
    if (typeof aVal !== typeof bVal) {
      return sortDirection
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    }

    // Sort based on type
    if (typeof aVal === 'string') {
      return sortDirection
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    if (typeof aVal === 'number' || typeof aVal === 'boolean') {
      return sortDirection
        ? aVal - bVal
        : bVal - aVal;
    }

    // Sort arrays based by joining and then doing string comparison
    if (Array.isArray(aVal)) {
      const _aVal = aVal.join('');
      const _bVal = bVal.join('');
      return sortDirection
        ? _aVal.localeCompare(_bVal)
        : _bVal.localeCompare(_aVal);
    }

    // Sort objects based on number of keys
    if (typeof aVal === 'object') {
      const aKeys = Object.keys(aVal);
      const bKeys = Object.keys(bVal);
      return sortDirection
        ? aKeys.length - bKeys.length
        : bKeys.length - aKeys.length;
    }

    return 0;
  });
};

export { ConSorter };
