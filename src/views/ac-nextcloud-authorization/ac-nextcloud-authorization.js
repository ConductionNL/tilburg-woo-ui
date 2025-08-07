import { useEffect, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcLink } from '@molecules';
import { LABELS, VISUALS } from '@constants';
import { AcLoader } from '@components';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import { useNavigate } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import config from '@src/config';
import { BASE_URL } from '@views/ac-beheer/core/utils/constants';

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

const AcNextcloudAuthorization = ({ store: { publications, themes } }) => {
  const nextcloud_user_id = getCookie('nextcloud_user_id');
  const navigate = useNavigate();

  if (nextcloud_user_id) {
    navigate('/beheer');
  }

  // fetch client id and secret key from local storage
  const clientId = getCookie('nextcloud_client_id');
  const secretKey = getCookie('nextcloud_secret_key');

  if (!clientId || !secretKey) {
    return (
      <AcSection spacing>
        <AcContainer>
          <AcColumn gap='tiger'>
            <AcColumn>
              <Heading>{LABELS.NEXTCLOUD_AUTHORIZATION}</Heading>
              <Paragraph>
                De tijd is verstreken. Probeer het opnieuw.
                <br />
                <br />
                <AcLink href={window.location.origin + '/login'} type='button'>
                  Terug naar login
                </AcLink>
              </Paragraph>
            </AcColumn>
          </AcColumn>
        </AcContainer>
      </AcSection>
    );
  }

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const state = searchParams.get('state');
  const code = searchParams.get('code');

  const redirect_url = sessionStorage.getItem('redirect_url');
  sessionStorage.removeItem('redirect_url');

  useEffect(async () => {
    let response;
    try {
      response = await fetch(`${BASE_URL}/oauth2/api/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${window.location.origin}/authorization`,
          client_id: clientId,
          client_secret: secretKey,
        }).toString(),
      });

      // check if response is good
      if (!response.ok) {
        setError(response.statusText);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    const { access_token, expires_in, refresh_token, user_id } =
      await response.json();

    // check if expires_in is set
    if (!expires_in) {
      setError(
        'Er is een fout opgetreden bij het autoriseren. Probeer het opnieuw.'
      );
      setIsLoading(false);
      return;
    }

    // set cookies
    setCookie('nextcloud_access_token', access_token, expires_in, {
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
    });
    setCookie('nextcloud_refresh_token', refresh_token, expires_in, {
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
    });
    setCookie('nextcloud_user_id', user_id, expires_in, {
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
    });

    if (redirect_url) {
      setTimeout(() => {
        navigate(redirect_url);
      }, 500);
    }

    setIsLoading(false);
  }, []);

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.NEXTCLOUD_AUTHORIZATION}</Heading>

            <AcFlex spacing='sm'>
              {isLoading && <AcLoader />}
              {!isLoading && !error && VISUALS.CHECK}
              {error && <Paragraph>{error}</Paragraph>}

              {redirect_url && (
                <Paragraph>Je wordt doorgestuurd naar {redirect_url}</Paragraph>
              )}
            </AcFlex>
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcNextcloudAuthorization));
