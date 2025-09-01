import { autorun, toJS, set } from 'mobx';

// Imports => Utilities
import { AcIsSet, AcIsUndefined, AcIsNull } from './ac-get-type-of';

const _type_of_storage = process.env.STORAGE || 'local';
const _storage = window[`${_type_of_storage}Storage`];

export const AcAutoSave = (store, callback, key) => {
  if (!store || !key) return;

  let firstRun = true;

  autorun(() => {
    // This code will run every time any observable property
    // in the provided store is updated
    const data = JSON.stringify(toJS(store));

    if (!firstRun && callback) {
      callback(data);
    }
    firstRun = false;
  });
};

export const AcAutoLoad = (store, key) => {
  if (!AcIsSet(store) || !AcIsSet(key)) return;

  const data = AcGetState(key);

  if (data && store) set(store, { [key]: data });
};

export const AcSaveState = (key, value) => {
  if (!AcIsSet(key) || AcIsUndefined(value)) return;

  if (AcIsNull(value)) _storage.setItem(key, value);
  else _storage.setItem(key, JSON.stringify(value));
};

export const AcGetState = (key) => {
  if (!AcIsSet(key)) return;

  const value = _storage.getItem(key);

  if (value) return JSON.parse(value);
  return value;
};

export const AcRemoveState = (key) => {
  if (!AcIsSet(key)) return;

  _storage.removeItem(key);
};

export const AcClearState = () => {
  _storage.clear();
};

export const AcSetCookie = (name, value, days) => {
  return new Promise((resolve) => {
    let expires;
    let secure = window.location.protocol === 'https:' ? 'secure;' : '';

    if (days) {
      let date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = `expires=${date.toGMTString()}`;
    } else {
      expires = '';
    }
    const cookiestring = `${name}=${value}; ${expires}; path=/; ${secure}`;
    document.cookie = cookiestring;

    resolve();
  });
};

export const AcGetCookie = (name) => {
  let nameEQ = `${name}=`;
  let ca = document.cookie.split(';');

  let n = 0;
  let len = ca.length;
  let result = null;

  for (n; n < len; n++) {
    let c = ca[n];
    let clen = c.length;

    while (c.charAt(0) === ' ') {
      c = c.substring(1, clen);
    }

    if (c.indexOf(nameEQ) === 0) {
      result = c.substring(nameEQ.length, clen);
      break;
    }
  }

  return result;
};

export const AcRemoveCookie = (name) => {
  AcSetCookie(name, '', -1);
};

export default {
  AcAutoLoad,
  AcAutoSave,
  AcSaveState,
  AcGetState,
  AcRemoveState,
  AcClearState,
  AcSetCookie,
  AcGetCookie,
  AcRemoveCookie,
};
