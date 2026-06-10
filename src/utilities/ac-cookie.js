export function getCookie(name) {
  // Split document.cookie on `;` to handle multiple cookies
  const cookieArr = document.cookie.split(';');

  for (let cookie of cookieArr) {
    // Remove leading spaces
    cookie = cookie.trim();
    // Check if this cookie starts with "<name>="
    if (cookie.startsWith(`${encodeURIComponent(name)}=`)) {
      // Return everything after the "<name>="
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }

  return null;
}

/**
 * Sets a cookie with the specified name, value and options
 * @param {string} name - The name of the cookie
 * @param {string} value - The value to store in the cookie
 * @param {number} maxAgeSeconds - Maximum age of the cookie in seconds
 * @param {Object} options - Additional cookie options
 * @param {boolean} [options.secure] - Whether the cookie should only be transmitted over secure HTTPS
 * @param {boolean} [options.httpOnly] - Whether the cookie should be accessible only through HTTP(S)
 * @param {string} [options.sameSite] - SameSite attribute ('strict', 'lax' or 'none')
 */
export function setCookie(name, value, maxAgeSeconds, options = {}) {
  const { secure, httpOnly, sameSite } = options;
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; max-age=${maxAgeSeconds}; path=/`;
  if (secure) cookie += '; Secure';
  if (httpOnly) cookie += '; HttpOnly';
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  document.cookie = cookie;
}
