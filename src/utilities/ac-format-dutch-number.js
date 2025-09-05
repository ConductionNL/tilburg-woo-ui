/**
 * Formats numbers according to Dutch standards (dots as thousand separators)
 * @param {number} number - The number to format
 * @returns {string} - Formatted number string (e.g., 1234567 → "1.234.567")
 */
export const AcFormatDutchNumber = (number) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('nl-NL', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

export default AcFormatDutchNumber;
