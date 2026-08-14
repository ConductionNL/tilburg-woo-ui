/**
 * Reduces a caller-supplied redirect target to a safe, in-app path.
 *
 * The login page takes its destination from `?redirect_url=`, which is
 * attacker-controllable: a link to /login?redirect_url=https://evil.example
 * would hand the user to another site immediately after they authenticate,
 * with the credibility of having just logged in. That is an open redirect, and
 * a phishing primitive.
 *
 * Only same-site paths are allowed through; everything else falls back to the
 * caller's default. The checks are about the *shape* of the target rather than
 * matching a host, because the forms that slip past a naive host check are
 * exactly the ones that matter:
 *
 *   https://evil.example   absolute URL with a scheme
 *   //evil.example         protocol-relative — the browser supplies the scheme
 *   /\evil.example         backslash, which browsers normalise to //
 *   \\evil.example         both slashes written as backslashes
 *   javascript:alert(1)    a scheme that executes rather than navigates
 *
 * @param {string|null|undefined} target - The requested destination
 * @param {string} fallback - Where to go when the target is not usable
 * @returns {string} A path that stays within this application
 */
export const AcSafeRedirect = (target, fallback = '/') => {
  if (typeof target !== 'string') {
    return fallback;
  }

  // Browsers strip control characters and whitespace while resolving a URL, so
  // a tab inside "java<TAB>script:alert(1)" is discarded and the scheme runs.
  // Drop everything at or below U+0020 first, or these checks inspect a
  // different string than the browser will act on. Done by character code
  // rather than a regex so no control characters appear in this source file.
  const cleaned = Array.from(target)
    .filter((character) => character.charCodeAt(0) > 0x20)
    .join('');

  if (!cleaned) {
    return fallback;
  }

  // Treat backslashes as slashes when checking, matching how browsers and
  // routers normalise them.
  const normalised = cleaned.replace(/\\/g, '/');

  // Must be a path rooted at this site: anything carrying a scheme, or a bare
  // word, points somewhere else.
  if (!normalised.startsWith('/')) {
    return fallback;
  }

  // "//host" and "/\host" are protocol-relative and leave the site.
  if (normalised.startsWith('//')) {
    return fallback;
  }

  return cleaned;
};
