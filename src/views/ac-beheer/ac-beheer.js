import { useEffect, useMemo, useRef, useState } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { LABELS, LABELS_DYNAMIC, VISUALS } from '@constants';
import { AcContainer, AcFlex, AcSection } from '@atoms';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { getCookie } from '@src/utilities';
import { AcSearchResult, AcButton, AcFormField } from '@molecules';
import { AcModal } from '@components';
import loadable from '@loadable/component';
import AcColumn from '@atoms/ac-column/ac-column';
import { AcSideNav } from '@components';

// list pages
const AcBeheerVoorzieningenAanbod = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-aanbod/pages/ac-voorzieningen-aanbod'
  )
);
const AcBeheerVoorzieningenGebruik = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen-gebruik/ac-voorzieningen-gebruik')
);
const AcBeheerVoorzieningenVersie = loadable(() =>
  import('@views/ac-beheer/ac-voorzieningen-versie/ac-voorzieningen-versie')
);
const AcBeheerContracten = loadable(() =>
  import('@views/ac-beheer/ac-contracten/ac-contracten')
);
const AcBeheerOrganisaties = loadable(() =>
  import('@views/ac-beheer/ac-organisatie/ac-organisatie')
);
const AcBeheerKwetsbaarheden = loadable(() =>
  import('@views/ac-beheer/ac-kwetsbaarheid/ac-kwetsbaarheid')
);

const AcDashboard = loadable(() => import('@views/ac-beheer/dashboard'));

// detail pages
const AcBeheerVoorzieningenAanbodDetails = loadable(() =>
  import(
    '@src/views/ac-beheer/ac-voorzieningen-aanbod/pages/ac-voorzieningen-aanbod-details'
  )
);

const AcBeheer = () => {
  const navigate = useMemo(() => useNavigate(), []);

  const wrongPage = () => (
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

  const loggedIn = !!getCookie('nextcloud_user_id');
  const loggedOut = getCookie('logout');
  useEffect(() => {
    if (loggedOut) {
      navigate('/');
    }
    if (!loggedIn) {
      navigate(`/login?redirect_url=${window.location.pathname}`);
    }
  }, [loggedIn, loggedOut]);

  const { type, id } = useParams();

  if (window.location.pathname === '/beheer') {
    return <AcDashboard />;
  }

  if (!id) {
    switch (type) {
      case 'voorzieningen-aanbod':
        return <AcBeheerVoorzieningenAanbod />;
      case 'voorzieningen-gebruik':
        return <AcBeheerVoorzieningenGebruik />;
      case 'voorzieningen-versie':
        return <AcBeheerVoorzieningenVersie />;
      case 'contracten':
        return <AcBeheerContracten />;
      case 'organisaties':
        return <AcBeheerOrganisaties />;
      case 'kwetsbaarheden':
        return <AcBeheerKwetsbaarheden />;
      default:
        return wrongPage();
    }
  }

  switch (type) {
    case 'voorzieningen-aanbod':
      return <AcBeheerVoorzieningenAanbodDetails id={id} />;
    default:
      return wrongPage();
  }
};

export default withStore(observer(AcBeheer));
