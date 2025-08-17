import { ConSorterLogic } from '@src/utilities/con-sorter';

/**
 * Sorter for nested properties using the ConSorterLogic
 * 
 * completely replacing boilerplate code like this:
 * ```js
 * (a, b, direction) => {
 *   if (direction === null) return 0;
 *      const aTitle = a?.kwetsbaarheden?.[0]?.titel;
 *      const bTitle = b?.kwetsbaarheden?.[0]?.titel;
 *      return ConSorterLogic(aTitle, bTitle, direction);
 *   }
 * }
 * ```
 * with this:
 * ```js
 * byNested((r) => r?.kwetsbaarheden?.[0]?.titel)
 * ```
 * 
 * @param {Function} getter - The getter function for the nested property
 * @returns {Function} - The sorter function
 */
export const byNested = (getter) => (a, b, dir) => {
  if (dir === null) return 0;
  const va = getter(a) ?? '';
  const vb = getter(b) ?? '';
  return ConSorterLogic(va, vb, dir);
};
