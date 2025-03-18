import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import {
  Textbox,
  PrimaryActionButton,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { useNavigate } from 'react-router';
import { AcLink } from '@src/molecules';
import config from '@src/config';
import { acSafeParseRedirectUri } from '@src/utilities';
import { useSearchParams } from 'react-router-dom';

function setCookie(name, value, maxAgeSeconds) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; max-age=${maxAgeSeconds}; path=/;`;
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

const AcAuthentication = () => {
  const nextcloud_user_id = getCookie('nextcloud_user_id');

  if (nextcloud_user_id) {
    return (
      <div className='container container--compact'>
        <div>
          Je bent al ingelogd met Nextcloud. Je kunt nu naar de dashboard gaan.
        </div>
      </div>
    );
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const redirect_url = searchParams.get('redirect_url');

  // Save redirect_url to localStorage if it exists and is safe
  useEffect(() => {
    if (acSafeParseRedirectUri(redirect_url)) {
      localStorage.setItem('redirect_url', acSafeParseRedirectUri(redirect_url));
    }
  }, [redirect_url]);

  //   const authenticationHostname = config.authentication.baseURL.includes('index.php')
  //     ? new URL(config.authentication.baseURL).origin + '/index.php'
  //     : new URL(config.authentication.baseURL).origin;
  const authenticationHostname = 'https://vng.accept.commonground.nu';

  const [clientId, setClientId] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // save client id and secret key as a cookie for 5 minutes
    setCookie('nextcloud_client_id', clientId, 5 * 60);
    setCookie('nextcloud_secret_key', secretKey, 5 * 60);

    const url = new URL(authenticationHostname + '/apps/oauth2/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('scope', 'api');

    window.location.href = url.toString();
  };

  return (
    <form className='container container--compact' onSubmit={handleLogin}>
      <div>
        Om te beginnen met inloggen met Nextcloud moet je een client id en secret key
        aanmaken, als je dat nog niet gedaan hebt. Deze kun je vinden in de Nextcloud
        beheerder instellingen.
      </div>
      <br />
      <div>
        <p>
          Bij het aanmaken van een client id en secret key moet je de volgende
          redirect URI opgeven:
        </p>
        <br />
        <code className='ac-nextcloud-login__redirect-uri'>
          {window.location.origin}/authorization
        </code>
        <br />
        <br />
        <AcLink
          href={authenticationHostname + '/settings/admin/security'}
          target='_blank'
        >
          Open Nextcloud beheerder instellingen
        </AcLink>
      </div>

      <div className='ac-authentication-form'>
        <Textbox
          type='text'
          placeholder='Client ID'
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <Textbox
          type='password'
          placeholder='Secret key'
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
        />
      </div>
      <PrimaryActionButton type='submit' disabled={!clientId || !secretKey}>
        <VISUALS.ARROW_RIGHT />
        <span>Inloggen</span>
      </PrimaryActionButton>
    </form>
  );
};

export default withStore(observer(AcAuthentication));
