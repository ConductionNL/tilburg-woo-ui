// check if the redirect uri is safe to use and return the redirect uri if it is.
export const acSafeParseRedirectUri = (redirectUri) => {
  if (!redirectUri) {
    return null;
  }

  const allowedDomains = [window.location.hostname];

  // Handle relative paths starting with /
  if (redirectUri.startsWith('/')) {
    return redirectUri;
  }

  // Handle full URLs
  try {
    const url = new URL(redirectUri);
    if (allowedDomains.includes(url.hostname)) {
      return redirectUri;
    }
    return null;
  } catch (e) {
    return null;
  }
};
