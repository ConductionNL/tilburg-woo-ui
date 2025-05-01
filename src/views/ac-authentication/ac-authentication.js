import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { acSafeParseRedirectUri } from '@src/utilities';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router';

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
function setCookie(name, value, maxAgeSeconds, options = {}) {
  const { secure, httpOnly, sameSite } = options;
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; max-age=${maxAgeSeconds}; path=/`;
  if (secure) cookie += '; Secure';
  if (httpOnly) cookie += '; HttpOnly';
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  document.cookie = cookie;
}

function getCookie(name) {
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

function removeCookie(name) {
  document.cookie = `${encodeURIComponent(
    name
  )}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

const AcAuthentication = () => {
  const nextcloud_user_id = getCookie('nextcloud_user_id');
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const redirect_url = searchParams.get('redirect_url');

  useEffect(() => {
    if (nextcloud_user_id) {
      navigate('/beheer');
    }
  }, [nextcloud_user_id]);

  // Save redirect_url to localStorage if it exists and is safe
  useEffect(() => {
    if (acSafeParseRedirectUri(redirect_url)) {
      sessionStorage.setItem('redirect_url', acSafeParseRedirectUri(redirect_url));
    }
  }, [redirect_url]);
  const hostname = window.location.hostname;

  //   const authenticationHostname = config.authentication.baseURL.includes('index.php')
  //     ? new URL(config.authentication.baseURL).origin + '/index.php'
  //     : new URL(config.authentication.baseURL).origin;
  const authenticationHostname =
    hostname === 'vng.test.opencatalogi.nl'
      ? 'https://vng.test.commonground.nu'
      : 'https://vng.accept.commonground.nu';

  // TODO: do not make this hardcoded
  const [clientId, setClientId] = useState(
    hostname === 'vng.test.opencatalogi.nl'
      ? '8xz68cLwZo6Ep1kuyW01bVrc2SOBLwcRKdiEKWTubyxE8lL9VK1Iz4Ol3NOldyne'
      : 'VSCKXDSJmhXxa3DSWrCkNtFw3tUDQkPYj2CgBETTR8pioOp1qmcvhDr2nC1OF1zL'
  );
  const [secretKey, setSecretKey] = useState(
    hostname === 'vng.test.opencatalogi.nl'
      ? 'sCx6A5SgbkybkpBsaAsMXkFchzlwHp3dMcHjaS8nqTPSQ0IXt7DgEXJHoHJWtbCH'
      : 'emNfF5yBpAXPDGqghgm11bKDfNSgzdsd7uEdBq9GxHYg9E5USxVqZguKQ3QBYLoL'
  );

  const handleLogin = () => {
    // save client id and secret key as a cookie for 5 minutes
    setCookie('nextcloud_client_id', clientId, 5 * 60, {
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
    });
    setCookie('nextcloud_secret_key', secretKey, 5 * 60, {
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
    });

    const url = new URL(authenticationHostname + '/apps/oauth2/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('scope', 'api');

    window.location.href = url.toString();
  };

  const location = window.location.pathname;

  if (!nextcloud_user_id && location === '/login') {
    handleLogin();
    removeCookie('logout');
  }
};

export default withStore(observer(AcAuthentication));
