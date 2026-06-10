/**
 * Safely extracts text from values, only accepting actual strings
 * 
 * This utility is strict about data types:
 * - Simple strings (returned as-is)
 * - Numbers and booleans (converted to string)
 * - All other types including objects and arrays (ignored, returns empty string)
 * - Null/undefined values (returns empty string)
 * 
 * @param {*} value - The value to extract text from
 * @returns {string} - Plain text string safe for React rendering, or empty string if not a valid text type
 */
export const extractText = (value) => {
  // Return empty string for null/undefined/string 'null'
  if (value == null || value === 'null') {
    return '';
  }

  // If it's already a string, return it (trimmed)
  if (typeof value === 'string') {
    return value.trim();
  }

  // If it's a number or boolean, convert to string
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // For all other types (objects, arrays, functions, etc.), return empty string
  // This includes complex objects with XML-like properties
  return '';
};

/**
 * Safely extracts and formats title from values, only accepting strings
 * 
 * @param {*} titleValue - The title value to extract from
 * @returns {string} - Plain text title safe for React rendering, or fallback if not a string
 */
export const extractTitle = (titleValue) => {
  const extracted = extractText(titleValue);
  
  // Return fallback if no valid string title
  if (!extracted) {
    return 'Geen titel';
  }
  
  return extracted;
};

/**
 * Safely extracts and formats summary from values, only accepting strings
 * 
 * @param {*} summaryValue - The summary value to extract from  
 * @returns {string} - Plain text summary safe for React rendering, or empty string if not a string
 */
export const extractSummary = (summaryValue) => {
  const extracted = extractText(summaryValue);
  
  // Return empty string if no valid string summary
  if (!extracted) {
    return '';
  }
  
  // Limit summary length for display
  if (extracted.length > 300) {
    return extracted.substring(0, 297) + '...';
  }
  
  return extracted;
};

export default extractText;
