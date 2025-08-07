// eslint-disable-next-line import/no-unresolved
import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
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
import ConBeheerPageWrapper from './con-beheer-page-wrapper';

const AcBeheer = ({ store }) => {
  const navigate = useNavigate();
  const { user } = store;

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
    };

    checkAuth();
  }, [user, navigate]);

  const { type, id } = useParams();

  if (window.location.pathname === '/beheer') {
    return <AcDashboard />;
  }

  if (!id) {
    return <ConBeheerPageWrapper type={type} />;
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
      // For unknown types, let the generic page handle the wrong page display
      return <ConBeheerPageWrapper type={type} />;
  }
};

export default withStore(observer(AcBeheer));
