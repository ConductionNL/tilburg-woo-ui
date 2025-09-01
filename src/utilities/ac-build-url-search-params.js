import { DEFAULT_SEARCH_QUERY } from '@stores/publications.store';

const INVALID_VALUES = [null, undefined, ''];

const getValue = (value) => {
  if (typeof value == 'string' && decodeURIComponent(value) !== value) {
    return value;
  }

  if (value === undefined) {
    return null;
  }

  return encodeURIComponent(value.toString());
};

export const AcBuildURLSearchParams = (data) => {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'search' && value === '') {
      return;
    }

    if (!value) {
      return;
    }

    if (Object.keys(DEFAULT_SEARCH_QUERY).includes(key)) {
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
        params.append(`${key}[${subKey}]`, getValue(subValue));
      });
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((subValue) => {
        params.append(`${key}[]`, getValue(subValue));
      });
      return;
    }
    params.append(key, getValue(value));
  });

  return params.toString();
};
