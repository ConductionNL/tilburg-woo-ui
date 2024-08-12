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
  Object.entries(data).forEach(([key, value]) => {
    console.log('search param:', key, toJS(value));
    if (!value) {
      return;
    }

    if (Object.keys(DEFAULT_SEARCH_QUERY).includes(key)) {
      return;
    }

    if (
      !Array.isArray(value) &&
      typeof value === 'object' &&
      Object.values(value).filter((v) => !INVALID_VALUES.includes(v)).length === 0
    ) {
      console.log('EMPTY OBJECNT');
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

    params.append(key, getValue(value));
  });

  console.log('CALCULATED PARAMS:', params.toString());

  return params.toString();
};
