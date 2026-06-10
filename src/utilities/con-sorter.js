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
    return ConSorterLogic(aVal, bVal, sortDirection);
  });
};

/**
 * The sorting logic that drives the ConSorter.
 *
 * @param {*} a - The first object to compare
 * @param {*} b - The second object to compare
 * @param {boolean} sortDirection - The direction to sort (true = ascending, false = descending)
 * @note This function does not handle the direction value `null`, unlike its big brother ConSorter.
 * @returns {number} - The result of the comparison (1, 0, -1)
 */
const ConSorterLogic = (a, b, sortDirection) => {
  // Handle null/undefined values and empty strings
  if (a == null || a === '') return sortDirection ? 1 : -1;
  if (b == null || b === '') return sortDirection ? -1 : 1;

  // Handle different types
  if (typeof a !== typeof b) {
    return sortDirection
      ? String(a).localeCompare(String(b))
      : String(b).localeCompare(String(a));
  }

  // Sort based on type
  if (typeof a === 'string') {
    return sortDirection ? a.localeCompare(b) : b.localeCompare(a);
  }

  if (typeof a === 'number' || typeof a === 'boolean') {
    return sortDirection ? a - b : b - a;
  }

  // Sort arrays based by joining and then doing string comparison
  if (Array.isArray(a)) {
    const _a = a.join('');
    const _b = b.join('');
    return sortDirection ? _a.localeCompare(_b) : _b.localeCompare(_a);
  }

  // Sort objects based on number of keys
  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return sortDirection ? aKeys.length - bKeys.length : bKeys.length - aKeys.length;
  }

  return 0;
};

export default ConSorter;
export { ConSorter, ConSorterLogic };
