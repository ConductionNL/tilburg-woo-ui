import { isValidPhoneNumber } from 'libphonenumber-js';

const validateEmail = (email) => {
  return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
};

const validateWebsite = (website) => {
  // More permissive domain validation - allow domains with or without protocol
  // Matches: example.com, www.example.com, https://example.com, sub.domain.co.uk, etc.
  const domainRegex =
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;

  return domainRegex.test(website);
};

const validatePhone = (phone) => {
  if (!phone) return false;
  const trimmed = phone.replace(/\s+/g, '');
  if (trimmed.startsWith('+')) {
    return isValidPhoneNumber(trimmed);
  }
  if (trimmed.startsWith('06')) {
    return isValidPhoneNumber(trimmed, 'NL');
  }
  return false;
};

export { validateEmail, validateWebsite, validatePhone };
