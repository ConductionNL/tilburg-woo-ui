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
    if (INVALID_VALUES.includes(value)) {
      return;
    }

    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      Object.entries(data[key]).forEach(([subKey, subValue]) => {
        params.append(`${key}[${subKey}]`, getValue(subValue));
      });
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((value) => params.append(`${key}[]`, getValue(value)));
      return;
    }

    params.append(key, getValue(value));
  });

  return params.toString();
};
