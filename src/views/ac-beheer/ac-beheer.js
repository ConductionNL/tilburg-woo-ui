import { useEffect, useMemo } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { LABELS } from '@constants';
import { AcContainer, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';
import { useNavigate, useParams } from 'react-router';

import loadable from '@loadable/component';
const AcBeheerVoorzieningenAanbod = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen-aanbod/ac-voorzieningen-aanbod')
);

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

const AcBeheer = () => {
  const navigate = useMemo(() => useNavigate(), []);

  const loggedIn = !!getCookie('nextcloud_user_id');
  useEffect(() => {
    if (!loggedIn) {
      navigate(`/login?redirect_url=${window.location.pathname}`);
    }
  }, [loggedIn]);

  const { id } = useParams();

  let page = null;
  switch (id) {
    case 'voorzieningen-aanbod':
      page = <AcBeheerVoorzieningenAanbod />;
      break;
    case undefined:
      page = null;
      break;
    default:
      page = (
        <AcSection spacing>
          <AcContainer>
            <AcColumn gap='tiger'>
              <AcColumn>
                <Heading>{LABELS.WRONG_PAGE}</Heading>
              </AcColumn>
            </AcColumn>
          </AcContainer>
        </AcSection>
      );
      break;
  }

  if (page) return page;

  return (
    <AcSection spacing>
      <AcContainer>
        <AcColumn gap='tiger'>
          <AcColumn>
            <Heading>beheer page</Heading>
          </AcColumn>
        </AcColumn>
      </AcContainer>
    </AcSection>
  );
};

export default withStore(observer(AcBeheer));
