import { useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcCardCategory, AcLink } from '@molecules';
import { LABELS, PATHS, VISUALS } from '@constants';
import AcGrid from '@atoms/ac-grid/ac-grid';
import { AcLoader } from '@components';
import { AcContainer, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import { AcBuildURLSearchParams } from '@utils';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';
import { useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import config from '@src/config';

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

const AcSubjects = ({ store: { publications, themes } }) => {
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
                <AcLink
                  href={window.location.origin + '/login'}
                  type='button'
                >
                  Terug naar login
                </AcLink>
              </Paragraph>
            </AcColumn>
          </AcColumn>
        </AcContainer>
      </AcSection>
    );
  }

  const authenticationHostname = config.authentication.baseURL.includes('index.php')
    ? new URL(config.authentication.baseURL).origin + '/index.php'
    : new URL(config.authentication.baseURL).origin;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const state = searchParams.get('state');
  const code = searchParams.get('code');

  useEffect(async () => {
    try {
      const response = await fetch(`${authenticationHostname}/apps/oauth2/api/v1/token`, {
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

    const { access_token, expires_in, refresh_token, user_id } = await response.json();

    // check if expires_in is set
    if (!expires_in) {
      setError('Er is een fout opgetreden bij het autoriseren. Probeer het opnieuw.');
      setIsLoading(false);
      return;
    }

    // set cookies
    document.cookie = `nextcloud_access_token=${encodeURIComponent(access_token)}; max-age=${expires_in}; path=/;`;
    document.cookie = `nextcloud_refresh_token=${encodeURIComponent(refresh_token)}; max-age=${expires_in}; path=/;`;
    document.cookie = `nextcloud_user_id=${encodeURIComponent(user_id)}; max-age=${expires_in}; path=/;`;

    setIsLoading(false);
  }, []);

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.NEXTCLOUD_AUTHORIZATION}</Heading>

            {isLoading && <AcLoader />}
            {!isLoading && !error && VISUALS.CHECK}
            {error && <Paragraph>{error}</Paragraph>}
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcSubjects));
