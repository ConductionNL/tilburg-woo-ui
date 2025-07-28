// eslint-disable-next-line import/no-unresolved
import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { LABELS } from '@constants';
import { AcContainer, AcSection } from '@atoms';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { useNavigate, useParams } from 'react-router';
import { getCookie } from '@src/utilities';
import {
  AcDashboard,
  AcBeheerDienstDetails,
  AcBeheerGebruikenDetails,
  AcBeheerVoorzieningenVersieDetails,
  AcBeheerOvereenkomstenDetails,
  AcBeheerOrganisatieDetails,
  AcBeheerKwetsbaarheidDetails,
  AcBeheerContactpersoonDetails,
  AcBeheerApplicatiesDetails,
} from '@views/ac-beheer';
import AcColumn from '@atoms/ac-column/ac-column';
import ConBeheerPageWrapper from './con-beheer-page-wrapper';

const AcBeheer = ({ store }) => {
  const navigate = useNavigate();
  const { user } = store;

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

  // Check authentication using the new UserStore
  useEffect(() => {
    const checkAuth = async () => {
      // Check for legacy logout cookie
      const loggedOut = getCookie('logout');
      if (loggedOut) {
        await user.logout();
        navigate('/');
        return;
      }

      // TEMPORARILY DISABLED: Double auth check causing redirect loops
      // TODO: Re-enable after fixing the auth timing issue
      /*
      // Check authentication status
      const isAuthenticated = await user.checkAuthStatus();
      
      if (!isAuthenticated) {
        navigate(`/login?redirect_url=${window.location.pathname}`);
      }
      */

      console.log('AcBeheer loaded, user:', user.user); // Debug log
    };

    checkAuth();
  }, [user, navigate]);

  const { type, id } = useParams();

  if (window.location.pathname === '/beheer') {
    return <AcDashboard />;
  }

  if (!id) {
    switch (type) {
      case 'applicaties':
        return <ConBeheerPageWrapper type='applicaties' />;
      case 'diensten':
        return <ConBeheerPageWrapper type='diensten' />;
      case 'gebruiken':
        return <ConBeheerPageWrapper type='gebruiken' />;
      case 'voorzieningen-versie':
        return <ConBeheerPageWrapper type='voorzieningen-versie' />;
      case 'overeenkomsten':
        return <ConBeheerPageWrapper type='overeenkomsten' />;
      case 'organisaties':
        return <ConBeheerPageWrapper type='organisaties' />;
      case 'kwetsbaarheden':
        return <ConBeheerPageWrapper type='kwetsbaarheden' />;
      case 'contactpersonen':
        return <ConBeheerPageWrapper type='contactpersonen' />;
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
