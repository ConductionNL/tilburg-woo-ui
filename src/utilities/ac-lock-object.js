export const AcDeepFreezeObject = object => {
  Object.getOwnPropertyNames(object).forEach(name => {
    let prop = object[name];

    if (prop && typeof prop === 'object') AcDeepFreezeObject(prop);
  });

  return Object.freeze(object);
};

export const AcLockObject = obj => {
  let r = obj;
  r = AcDeepFreezeObject(r);
  r = Object.preventExtensions(r);
  r = Object.seal(r);
  return r;
};
