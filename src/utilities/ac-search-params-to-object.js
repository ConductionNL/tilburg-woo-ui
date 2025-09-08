export const AcSearchParamsToObject = (searchParams) => {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    // Match nested array: parent[child][]=value
    const nestedArrayMatch = key.match(/^([^[]+)\[([^[]+)\]\[\]$/);
    if (nestedArrayMatch) {
      const parent = nestedArrayMatch[1];
      const child = nestedArrayMatch[2];
      if (!params[parent]) params[parent] = {};
      if (!params[parent][child]) params[parent][child] = [];
      params[parent][child].push(decodeURIComponent(value));
      continue;
    }

    // Match parent array: parent[]=value
    const parentArrayMatch = key.match(/^([^[]+)\[\]$/);
    if (parentArrayMatch) {
      const parent = parentArrayMatch[1];
      if (!params[parent]) params[parent] = [];
      params[parent].push(decodeURIComponent(value));
      continue;
    }

    // Match nested single value: parent[child]=value
    const nestedSingleMatch = key.match(/^([^[]+)\[([^[]+)\]$/);
    if (nestedSingleMatch) {
      const parent = nestedSingleMatch[1];
      const child = nestedSingleMatch[2];
      if (!params[parent]) params[parent] = {};

      // Special handling for @self - allow multiple values with same key to become array
      if (parent === '@self') {
        if (!params[parent][child]) {
          params[parent][child] = [];
        }
        // If it's already an array, push to it; if it's a string, convert to array
        if (Array.isArray(params[parent][child])) {
          params[parent][child].push(decodeURIComponent(value));
        } else {
          params[parent][child] = [params[parent][child], decodeURIComponent(value)];
        }
      } else {
        params[parent][child] = decodeURIComponent(value);
      }
      continue;
    }

    params[key] = decodeURIComponent(value);
  }

  return params;
};
