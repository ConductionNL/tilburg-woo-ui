import { useEffect, useMemo } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { LABELS } from '@constants';
import { AcContainer, AcSection } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { useNavigate, useParams } from 'react-router';
import { getCookie } from '@src/utilities';
import {
  AcBeheerDienst,
  AcBeheerGebruiken,
  AcBeheerVoorzieningenVersie,
  AcBeheerOvereenkomsten,
  AcBeheerOrganisaties,
  AcBeheerKwetsbaarheden,
  AcDashboard,
  AcBeheerDienstDetails,
  AcBeheerGebruikenDetails,
  AcBeheerVoorzieningenVersieDetails,
  AcBeheerOvereenkomstenDetails,
  AcBeheerOrganisatieDetails,
  AcBeheerKwetsbaarheidDetails,
  AcBeheerContactpersonen,
  AcBeheerContactpersoonDetails,
  AcBeheerApplicaties,
  AcBeheerApplicatiesDetails,
} from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';

// Try to import container constants (generated at runtime)
let containerConfig;
try {
  containerConfig = require('@constants/container.constants');
} catch (error) {
  console.warn('Container constants not available, falling back to hostname-based logic');
  containerConfig = null;
}

export const BASE_URL = (() => {
  // Always use container config - no hardcoded fallbacks in main codebase
  if (!containerConfig || !containerConfig.getGemmaEndpoint) {
    throw new Error('GEMMA endpoint not configured. Please check your environment setup.');
  }
  
  return containerConfig.getGemmaEndpoint();
})();

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
      case 'applicaties':
        return <AcBeheerApplicaties />;
      case 'diensten':
        return <AcBeheerDienst />;
      case 'gebruiken':
        return <AcBeheerGebruiken />;
      case 'voorzieningen-versie':
        return <AcBeheerVoorzieningenVersie />;
      case 'overeenkomsten':
        return <AcBeheerOvereenkomsten />;
      case 'organisaties':
        return <AcBeheerOrganisaties />;
      case 'kwetsbaarheden':
        return <AcBeheerKwetsbaarheden />;
      case 'contactpersonen':
        return <AcBeheerContactpersonen />;
      default:
        return wrongPage();
    }
  }

  switch (type) {
    case 'applicaties':
      return <AcBeheerApplicatiesDetails id={id} />;
    case 'diensten':
      return <AcBeheerDienstDetails id={id} />;
    case 'gebruiken':
      return <AcBeheerGebruikenDetails id={id} />;
    case 'voorzieningen-versie':
      return <AcBeheerVoorzieningenVersieDetails id={id} />;
    case 'overeenkomsten':
      return <AcBeheerOvereenkomstenDetails id={id} />;
    case 'organisaties':
      return <AcBeheerOrganisatieDetails id={id} />;
    case 'kwetsbaarheden':
      return <AcBeheerKwetsbaarheidDetails id={id} />;
    case 'contactpersonen':
      return <AcBeheerContactpersoonDetails id={id} />;
    default:
      return wrongPage();
  }
};

export default withStore(observer(AcBeheer));
