import { useEffect, useMemo, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcButton, AcCardCategory, AcFormField, AcLink } from '@molecules';
import { LABELS, PATHS } from '@constants';
import config from '@src/config';
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

const AcNextcloudLogin = () => {
  const nextcloud_user_id = getCookie('nextcloud_user_id');

  if (nextcloud_user_id) {
    return (
      <AcSection spacing>
        <AcContainer>
          <AcColumn gap='tiger'>
            <AcColumn>
              <Heading>{LABELS.NEXTCLOUD_LOGIN}</Heading>
              <Paragraph>
                Je bent al ingelogd met Nextcloud. Je kunt nu naar de dashboard gaan.
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

  const [clientId, setClientId] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const handleLogin = () => {
    // save client id and secret key as a cookie
    setCookie('nextcloud_client_id', clientId, 5 * 60);
    setCookie('nextcloud_secret_key', secretKey, 5 * 60);

    // /apps/oauth2/authorize?response_type=code&client_id={{client id}}&scope=api
    const url = new URL(authenticationHostname + '/apps/oauth2/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('scope', 'api');

    window.location.href = url.toString();
  };

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.NEXTCLOUD_LOGIN}</Heading>
            <Paragraph>
              Om te beginnen met inloggen met Nextcloud moet je een client id en
              secret key aanmaken. Deze kun je vinden in de Nextcloud beheerder
              instellingen.
            </Paragraph>
          </AcColumn>

          <AcColumn>
            <Paragraph>
              Bij het aanmaken van een client id en secret key moet je de volgende
              redirect URI opgeven:
              <br />
              <code className='ac-nextcloud-login__redirect-uri'>
                {window.location.origin}/nextcloud/authorization
              </code>
            </Paragraph>
            <AcLink
              href={authenticationHostname + '/settings/admin/security'}
              type='button'
              target='_blank'
            >
              Open Nextcloud beheerder instellingen
            </AcLink>
          </AcColumn>

          <AcColumn>
            <AcFormField label='Client ID' value={clientId} onChange={setClientId} />
            <AcFormField
              label='Secret Key'
              value={secretKey}
              onChange={setSecretKey}
            />
          </AcColumn>

          <AcColumn>
            <AcButton
              style='button'
              disabled={!clientId || !secretKey}
              onClick={handleLogin}
            >
              Inloggen
            </AcButton>
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcNextcloudLogin));
