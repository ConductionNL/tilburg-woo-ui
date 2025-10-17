// Lightweight format validators used by ConDynamicSchemaForm
// Keep implementations simple and dependency-light; prefer native APIs and minimal regexes

import { isValidPhoneNumber } from 'libphonenumber-js';

export const isValidUrl = (value) => {
  try {
    // Accept http(s) and other valid URL schemes
    // new URL requires a scheme; for uri/iri-reference allow relative by falling back to regex
    // For our purposes, attempt URL() first
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
};

export const isValidEmail = (value) => {
  // Simple pragmatic email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
};

export const isValidHostname = (value) => {
  // RFC 1035-ish (no punycode conversion here; treat idn-hostname the same for now)
  return /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(
    value
  );
};

export const isValidUUID = (value) => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value
  );
};

export const isValidIPv4 = (value) => {
  return /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(
    value
  );
};

export const isValidIPv6 = (value) => {
  // Very permissive IPv6 pattern
  return /^(?:[\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$|^(?:[\da-fA-F]{1,4}:){1,7}:$|^:(?::[\da-fA-F]{1,4}){1,7}$/.test(
    value
  );
};

export const isValidTelephone = (value) => {
  if (!value) return false;
  // Remove all spaces to match register form validation
  const trimmed = value.replace(/\s+/g, '');
  // Check if starts with international code (+)
  if (trimmed.startsWith('+')) {
    return isValidPhoneNumber(trimmed);
  }
  // Check if starts with Dutch mobile prefix (06)
  if (trimmed.startsWith('06')) {
    return isValidPhoneNumber(trimmed, 'NL');
  }
  // Invalid format
  return false;
};

export const isValidDuration = (value) => {
  // ISO8601 duration e.g. PT1H30M
  return /^P(?!$)(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/.test(
    value
  );
};

export const isBase64 = (value) => {
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
    value
  );
};

export const isValidRegex = (value) => {
  try {
    // eslint-disable-next-line no-new
    new RegExp(value);
    return true;
  } catch (_) {
    return false;
  }
};

export const isValidKvk = (value) => {
  // KvK number: 8 digits (lenient)
  return /^\d{8}$/.test(value);
};

export const isValidRsin = (value) => {
  // RSIN: 9 digits (lenient)
  return /^\d{9}$/.test(value);
};

export const isValidBsn = (value) => {
  // BSN: 8 or 9 digits (lenient)
  return /^\d{8,9}$/.test(value);
};

export const isValidOidn = (value) => {
  // OIDN: best-effort (digits and dots)
  return /^[\d.]{6,}$/.test(value);
};

export const validateByFormat = (format, value) => {
  if (value === undefined || value === null || value === '') return true;
  switch (format) {
    case 'date':
    case 'date-time':
    case 'time':
      // Browser input handles surface-level constraints; if parsable, accept
      return true;
    case 'duration':
      return isValidDuration(value);
    case 'url':
    case 'uri':
    case 'accessUrl':
    case 'shareUrl':
    case 'downloadUrl':
      return isValidUrl(value);
    case 'uuid':
      return isValidUUID(value);
    case 'email':
    case 'idn-email':
      return isValidEmail(value);
    case 'hostname':
    case 'idn-hostname':
      return isValidHostname(value);
    case 'ipv4':
      return isValidIPv4(value);
    case 'ipv6':
      return isValidIPv6(value);
    case 'telephone':
      return isValidTelephone(value);
    case 'binary':
      return true;
    case 'byte':
      return isBase64(value);
    case 'password':
      return true;
    case 'regex':
      return isValidRegex(value);
    case 'kvk':
      return isValidKvk(value);
    case 'rsin':
      return isValidRsin(value);
    case 'bsn':
      return isValidBsn(value);
    case 'oidn':
      return isValidOidn(value);
    // markdown/html: no validation (editing handled by UI)
    default:
      return true;
  }
};
