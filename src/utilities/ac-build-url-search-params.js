import { DEFAULT_SEARCH_QUERY } from '@stores/publications.store';

const INVALID_VALUES = [null, undefined, ''];

const getValue = (value) => {
  // If value is already encoded, return as-is to prevent double encoding
  if (typeof value === 'string' && decodeURIComponent(value) !== value) {
    return value;
  }

  if (value === undefined) {
    return null;
  }

  // Only encode the value, not the key
  return encodeURIComponent(value.toString());
};

export const AcBuildURLSearchParams = (data) => {
  const paramPairs = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key === 'search' && value === '') {
      return;
    }

    if (!value && !(key === '_limit' && value === 0)) {
      return;
    }

    if (Object.keys(DEFAULT_SEARCH_QUERY).includes(key) && value === DEFAULT_SEARCH_QUERY[key]) {
      return;
    }

    // If the object is empty, skip it.
    if (
      !Array.isArray(value) &&
      typeof value === 'object' &&
      Object.values(value).filter((v) => !INVALID_VALUES.includes(v)).length === 0
    ) {
      return;
    }

    if (!Array.isArray(value) && typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (!subValue) {
          return;
        }
        // Support nested arrays: key[subKey][]=a&key[subKey][]=b
        if (Array.isArray(subValue)) {
          subValue.forEach((arrVal) => {
            if (!arrVal) return;
            // Special case for @self - don't add [] brackets
            if (key === '@self') {
              paramPairs.push(`${key}[${subKey}]=${getValue(arrVal)}`);
            } else {
              // Don't encode the key, only the value
              paramPairs.push(`${key}[${subKey}][]=${getValue(arrVal)}`);
            }
          });
          return;
        }
        // Don't encode the key, only the value
        paramPairs.push(`${key}[${subKey}]=${getValue(subValue)}`);
      });
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((subValue) => {
        // Don't encode the key, only the value
        paramPairs.push(`${key}[]=${getValue(subValue)}`);
      });
      return;
    }
    // Don't encode the key, only the value
    paramPairs.push(`${key}=${getValue(value)}`);
  });

  return paramPairs.join('&');
};
