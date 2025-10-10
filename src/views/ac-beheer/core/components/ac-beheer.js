// eslint-disable-next-line import/no-unresolved
import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router';
import { getCookie } from '@src/utilities';
import { AcDashboard } from '@views/ac-beheer';
import ConBeheerPageWrapper from './con-beheer-page-wrapper';
import ConGenericBeheerDetailsPage from './con-generic-beheer-details-page';
import ConOrganisatieDetailsPage from '@views/ac-beheer/domains/ac-organisatie/con-organisatie-details-page';
import ConProductDetailsPage from '../../domains/ac-product/con-product-details-page';
import ConMyAccountPage from './custom/con-my-account';
import ConMyOrganisationPage from './custom/con-my-organisation';
import ConModuleDetailsPage from '../../domains/ac-module/con-module-details-page';
import ConContactpersoonDetailsPage from '../../domains/ac-contactpersoon/con-contactpersoon-details-page';
import ConDienstDetailsPage from '../../domains/ac-dienst/con-dienst-details-page';
import ConKoppelingDetailsPage from '../../domains/ac-koppeling/con-koppeling-details-page';
import ConGebruikDetailsPage from '../../domains/ac-gebruiken/con-gebruik-details-page';

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
    return <AcDashboard store={store} />;
  }

  if (type === 'my-organisation') {
    return <ConMyOrganisationPage />;
  }
  if (type === 'my-account') {
    return <ConMyAccountPage />;
  }

  if (!id) {
    return <ConBeheerPageWrapper type={type} />;
  }

  if (type === 'organisaties') {
    return <ConOrganisatieDetailsPage />;
  }
  if (type === 'product') {
    return <ConProductDetailsPage />;
  }
  if (type === 'module') {
    return <ConModuleDetailsPage />;
  }
  if (type === 'dienst') {
    return <ConDienstDetailsPage />;
  }
  if (type === 'gebruik') {
    return <ConGebruikDetailsPage />;
  }
  if (type === 'koppeling') {
    return <ConKoppelingDetailsPage />;
  }
  if (type === 'contactpersoon') {
    return <ConContactpersoonDetailsPage />;
  }

  if (type) {
    return <ConGenericBeheerDetailsPage type={type} id={id} />;
  }

  return <span>I have no clue how you got here</span>;
};

export default withStore(observer(AcBeheer));
