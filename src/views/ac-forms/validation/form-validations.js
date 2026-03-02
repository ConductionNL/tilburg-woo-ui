import { isValidPhoneNumber } from 'libphonenumber-js';

const validateEmail = (email) => {
  return email && email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
};

const validateWebsite = (website) => {
  if (!website || typeof website !== 'string') return false;

  const trimmed = website.trim();
  if (!trimmed) return false;

  // More comprehensive domain validation
  // Requirements:
  // - Optional protocol (http:// or https://)
  // - Optional www subdomain
  // - Domain name must have at least one character before the TLD
  // - Domain parts must start and end with alphanumeric (can contain hyphens in between)
  // - Must have a valid TLD (2+ characters)
  // - Optional path/query/fragment
  //
  // Invalid examples: www.nl, http://.nl, just-hyphens.nl
  // Valid examples: conduction.nl, example.nl, www.example.com, https://sub.domain.co.uk, conduction.nl/path

  const domainRegex =
    /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;

  if (!domainRegex.test(trimmed)) return false;

  // Additional check: ensure domain is not just 'www.tld' (e.g., www.nl)
  // Extract the domain part (without protocol)
  const withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  const domainPart = withoutProtocol.split('/')[0]; // Get domain without path

  // Check if domain is just www.tld or subdomain.tld without a proper domain name
  const parts = domainPart.split('.');
  if (parts.length < 2) return false; // Must have at least domain.tld

  // Check if any part is empty or only contains hyphens
  if (parts.some((part) => !part || part.trim() === '' || /^-+$/.test(part))) {
    return false;
  }

  // Check that the part before TLD is not just 'www' (reject www.nl, www.com, etc.)
  if (parts.length === 2 && parts[0] === 'www') {
    return false;
  }

  // Ensure the main domain part (before TLD) has at least one alphanumeric character
  // For www.example.nl: check 'example'
  // For sub.example.nl: check 'example'
  const tldIndex = parts.length - 1;
  const domainBeforeTld = parts[tldIndex - 1];

  if (
    !domainBeforeTld ||
    domainBeforeTld === 'www' ||
    !/[a-zA-Z0-9]/.test(domainBeforeTld)
  ) {
    return false;
  }

  return true;
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
