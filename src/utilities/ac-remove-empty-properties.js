export const AcRemoveEmptyProperties = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((prop) => {
    if (obj[prop] !== null && obj[prop] !== undefined) {
      newObj[prop] = obj[prop];
    }
  });
  return newObj;
};
