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
import { getCookie } from '@src/utilities';
const AcBeheerVoorzieningenAanbod = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen-aanbod/ac-voorzieningen-aanbod')
);

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

  return page;
};

export default withStore(observer(AcBeheer));
