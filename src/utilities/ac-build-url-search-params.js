import { toJS } from 'mobx';
import { DEFAULT_SEARCH_QUERY } from '@stores/documents.store';

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
  console.log(toJS(data));
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'search' && value === '') {
      return;
    }
    console.log('search param:', key, toJS(value));
    if (!value) {
      console.log(`skipping ${key}`);
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

  console.log('CALCULATED PARAMS:', params.toString());

  return params.toString();
};
