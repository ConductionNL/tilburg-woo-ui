import { useEffect, useMemo } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { LABELS } from '@constants';
import { AcContainer, AcSection } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { useNavigate, useParams } from 'react-router';
import { getCookie } from '@src/utilities';
import {
  AcBeheerVoorzieningenAanbod,
  AcBeheerVoorzieningenGebruik,
  AcBeheerVoorzieningenVersie,
  AcBeheerContracten,
  AcBeheerOrganisaties,
  AcBeheerKwetsbaarheden,
  AcDashboard,
  AcBeheerVoorzieningenAanbodDetails,
  AcBeheerVoorzieningen,
  AcBeheerVoorzieningenDetails,
  AcBeheerVoorzieningenGebruikDetails,
  AcBeheerVoorzieningenVersieDetails,
} from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';

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
      case 'voorzieningen':
        return <AcBeheerVoorzieningen />;
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
    case 'voorzieningen':
      return <AcBeheerVoorzieningenDetails id={id} />;
    case 'voorzieningen-aanbod':
      return <AcBeheerVoorzieningenAanbodDetails id={id} />;
    case 'voorzieningen-gebruik':
      return <AcBeheerVoorzieningenGebruikDetails id={id} />;
    case 'voorzieningen-versie':
      return <AcBeheerVoorzieningenVersieDetails id={id} />;
    default:
      return wrongPage();
  }
};

export default withStore(observer(AcBeheer));
