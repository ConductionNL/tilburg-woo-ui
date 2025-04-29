/**
 * Collapse extended object(s) to their id's
 * 
 * returns a string of ids separated by commas (if there are multiple id's)
 * 
 * @example
 * collapseExtendedObjects(['1', '2', '3']) // '1, 2, 3'
 * collapseExtendedObjects({ id: '1' }) // '1'
 * collapseExtendedObjects(['1', { id: '2' }, '3']) // '1, 2, 3'
 * 
 * @param {(Record<string, any> | string)[] | Record<string, any> | string} extendedObjects
 * @returns {string}
 */
export const collapseExtendedObjects = (extendedObjects) => {
    if (Array.isArray(extendedObjects)) {
      return extendedObjects.map((s) => (typeof s === 'object' ? s.id : s)).join(', ');
    }
  
    return typeof extendedObjects === 'object' ? extendedObjects.id : extendedObjects;
  };