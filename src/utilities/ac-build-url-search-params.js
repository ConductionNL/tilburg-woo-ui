export const AcBuildURLSearchParams = (data) => {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((value) => params.append(`${key}[]`, value.toString()));
      return;
    }

    params.append(key, window.encodeURI(value.toString()));
  });
  return params.toString();
};
