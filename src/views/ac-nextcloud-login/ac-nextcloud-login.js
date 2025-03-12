import { useEffect, useMemo } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { AcButton, AcCardCategory, AcLink } from '@molecules';
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

const AcNextcloudLogin = () => {
  const authenticationHostname = config.authentication.baseURL.includes('index.php')
    ? new URL(config.authentication.baseURL).origin + '/index.php'
    : new URL(config.authentication.baseURL).origin;

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>{LABELS.NEXTCLOUD_LOGIN}</Heading>
            <Paragraph>
              Om te beginnen met inloggen met nextcloud moet je een client id en
              secret key aanmaken bij
              <AcLink
                href={authenticationHostname + '/settings/admin/security'}
                target='_blank'
              >
                Nextcloud
              </AcLink>
              .
            </Paragraph>

            <Paragraph>{config.authentication.baseURL}</Paragraph>
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcNextcloudLogin));
