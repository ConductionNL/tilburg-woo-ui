export const AcSearchParamsToObject = (searchParams) => {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.includes('[]')) {
      const newKey = key.replace('[]', '');
      if (!params[newKey]) {
        params[newKey] = [];
      }
      params[newKey].push(decodeURIComponent(value));
      continue;
    }

    if (key.includes('[') && key.includes(']')) {
      const newKeys = key.split('[');
      if (newKeys.length !== 2) {
        return;
      }

      if (!params[newKeys[0]]) {
        params[newKeys[0]] = {};
      }

      params[newKeys[0]][newKeys[1].substring(0, newKeys[1].length - 1)] =
        decodeURIComponent(value);
      continue;
    }

    params[key] = decodeURIComponent(value);
  }

  return params;
};
