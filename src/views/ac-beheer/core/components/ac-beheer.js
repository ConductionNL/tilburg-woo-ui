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
import ConGenericBeheerDetailsPage from './con-generic-beheer-details-page';

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

  if (type) {
    return <ConGenericBeheerDetailsPage type={type} id={id} />;
  }

  return <span>I have no clue how you got here</span>;
};

export default withStore(observer(AcBeheer));
