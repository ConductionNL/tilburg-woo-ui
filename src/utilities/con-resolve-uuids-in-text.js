/**
 * Generic UUID-to-Name resolver utility
 * 
 * This utility automatically detects UUIDs in text/objects and replaces them
 * with human-readable names using the names cache system.
 */

import React from 'react';

// UUID regex pattern - matches standard UUID format
const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

/**
 * Checks if a string looks like a UUID
 * @param {string} str - String to check
 * @returns {boolean} True if string matches UUID pattern
 */
export const isUUID = (str) => {
  if (typeof str !== 'string') return false;
  return UUID_REGEX.test(str);
};

/**
 * Extracts all UUIDs from a text string
 * @param {string} text - Text to search for UUIDs
 * @returns {string[]} Array of unique UUIDs found in the text
 */
export const extractUUIDs = (text) => {
  if (typeof text !== 'string') return [];
  const matches = text.match(UUID_REGEX);
  return matches ? [...new Set(matches)] : [];
};

/**
 * Resolves a single text string by replacing UUIDs with names
 * @param {string} text - Text containing UUIDs to resolve
 * @param {Object} objectStore - ObjectStore instance for names resolution
 * @returns {Promise<string>} Text with UUIDs replaced by names
 */
export const resolveUUIDsInText = async (text, objectStore) => {
  if (typeof text !== 'string' || !objectStore) {
    return text;
  }

  const uuids = extractUUIDs(text);
  if (uuids.length === 0) {
    return text;
  }

  try {
    // Resolve all UUIDs in parallel for better performance
    const namePromises = uuids.map(uuid => 
      objectStore.getNamesForSingleId(uuid).catch(() => uuid) // Fallback to UUID on error
    );
    
    const resolvedNames = await Promise.all(namePromises);
    
    // Replace each UUID with its resolved name
    let resolvedText = text;
    uuids.forEach((uuid, index) => {
      const resolvedName = resolvedNames[index];
      // Use global replace to handle multiple occurrences of the same UUID
      resolvedText = resolvedText.replace(new RegExp(uuid, 'g'), resolvedName);
    });
    
    return resolvedText;
  } catch (error) {
    console.warn('Failed to resolve UUIDs in text:', error);
    return text; // Return original text on error
  }
};

/**
 * Resolves UUIDs in an array of strings
 * @param {string[]} textArray - Array of strings that may contain UUIDs
 * @param {Object} objectStore - ObjectStore instance for names resolution
 * @returns {Promise<string[]>} Array with UUIDs replaced by names
 */
export const resolveUUIDsInArray = async (textArray, objectStore) => {
  if (!Array.isArray(textArray) || !objectStore) {
    return textArray;
  }

  try {
    const resolvedPromises = textArray.map(text => 
      resolveUUIDsInText(text, objectStore)
    );
    
    return await Promise.all(resolvedPromises);
  } catch (error) {
    console.warn('Failed to resolve UUIDs in array:', error);
    return textArray;
  }
};

/**
 * Recursively resolves UUIDs in an object's string properties
 * @param {Object} obj - Object that may contain UUIDs in string properties
 * @param {Object} objectStore - ObjectStore instance for names resolution
 * @param {string[]} excludeKeys - Keys to exclude from UUID resolution
 * @returns {Promise<Object>} Object with UUIDs replaced by names
 */
export const resolveUUIDsInObject = async (obj, objectStore, excludeKeys = ['id', '@self']) => {
  if (!obj || typeof obj !== 'object' || !objectStore) {
    return obj;
  }

  try {
    const resolvedObj = { ...obj };
    
    for (const [key, value] of Object.entries(resolvedObj)) {
      // Skip excluded keys
      if (excludeKeys.includes(key)) {
        continue;
      }
      
      if (typeof value === 'string') {
        resolvedObj[key] = await resolveUUIDsInText(value, objectStore);
      } else if (Array.isArray(value)) {
        resolvedObj[key] = await resolveUUIDsInArray(value, objectStore);
      } else if (typeof value === 'object' && value !== null) {
        resolvedObj[key] = await resolveUUIDsInObject(value, objectStore, excludeKeys);
      }
    }
    
    return resolvedObj;
  } catch (error) {
    console.warn('Failed to resolve UUIDs in object:', error);
    return obj;
  }
};

/**
 * React hook for resolving UUIDs in text with state management
 * @param {string} text - Text that may contain UUIDs
 * @param {Object} objectStore - ObjectStore instance for names resolution
 * @returns {string} Text with UUIDs resolved to names
 */
export const useResolvedText = (text, objectStore) => {
  const [resolvedText, setResolvedText] = React.useState(text);
  
  React.useEffect(() => {
    if (text && objectStore) {
      resolveUUIDsInText(text, objectStore)
        .then(setResolvedText)
        .catch(() => setResolvedText(text));
    } else {
      setResolvedText(text);
    }
  }, [text, objectStore]);
  
  return resolvedText;
};

/**
 * React hook for resolving UUIDs in an array with state management
 * @param {string[]} textArray - Array of strings that may contain UUIDs
 * @param {Object} objectStore - ObjectStore instance for names resolution
 * @returns {string[]} Array with UUIDs resolved to names
 */
export const useResolvedArray = (textArray, objectStore) => {
  const [resolvedArray, setResolvedArray] = React.useState(textArray);
  
  React.useEffect(() => {
    if (textArray && objectStore) {
      resolveUUIDsInArray(textArray, objectStore)
        .then(setResolvedArray)
        .catch(() => setResolvedArray(textArray));
    } else {
      setResolvedArray(textArray);
    }
  }, [textArray, objectStore]);
  
  return resolvedArray;
};

export default {
  isUUID,
  extractUUIDs,
  resolveUUIDsInText,
  resolveUUIDsInArray,
  resolveUUIDsInObject,
  useResolvedText,
  useResolvedArray,
};
