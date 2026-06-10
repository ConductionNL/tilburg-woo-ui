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
import ConModuleVersieDetailsPage from '../../domains/con-module-version/con-module-version-detail-page';
import BeheerPageConfigFactory from '../factories/con-beheer-page-config-factory';

const AcBeheer = ({ store }) => {
  const navigate = useNavigate();
  const { user, object, menu } = store;

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

  // Trigger beheer data warmup when component mounts (non-blocking)
  // Fire and forget - dashboard renders immediately, data loads in background
  useEffect(() => {
    object.warmupBeheerData().catch((error) => {
      console.warn('⚠️ Background data warmup failed:', error);
    });
  }, [object]);

  const { type, id } = useParams();

  // Validate type against menu system and redirect if invalid
  useEffect(() => {
    // Skip validation for dashboard route
    if (window.location.pathname === '/beheer') {
      return;
    }

    // Skip validation for detail pages (they have an id)
    if (id) {
      return;
    }

    // Skip validation for special routes
    if (type === 'my-account' || type === 'my-organisation' || type === 'element') {
      return;
    }

    // Skip if no type is present
    if (!type) {
      return;
    }

    // Get admin dashboard menu to check valid types
    const dashboardMenu = menu.getAdminDashboardMenu(
      user?.isAuthenticated,
      user?.userGroups || []
    );

    if (
      !dashboardMenu ||
      !dashboardMenu.items ||
      !Array.isArray(dashboardMenu.items)
    ) {
      return;
    }

    // Extract valid types from menu items
    const validTypes = new Set();
    dashboardMenu.items.forEach((item) => {
      if (!item.link || typeof item.link !== 'string') {
        return;
      }

      const link = item.link.trim();

      // Filter out non-beheer links and excluded links
      if (
        !link.startsWith('/beheer/') ||
        link === '/beheer' ||
        link === '/beheer/my-account' ||
        link === '/beheer/my-organisation'
      ) {
        return;
      }

      // Extract type from link (e.g., "/beheer/applicaties" => "applicaties")
      const linkType = link.replace(/^\/beheer\//, '').split('/')[0];
      if (linkType) {
        validTypes.add(linkType);
      }
    });

    // Check if type exists in factory (if it does, don't block it)
    let hasFactoryEntry = false;
    const factoryConfig = BeheerPageConfigFactory.createConfig(type);
    if (
      factoryConfig &&
      typeof factoryConfig === 'object' &&
      !factoryConfig.isDynamicEntry
    ) {
      hasFactoryEntry = true;
    }

    // Check if current type is valid (either in menu or has factory entry)
    if (!validTypes.has(type) && !hasFactoryEntry) {
      navigate('/beheer');
    }
  }, [type, id, menu, user.isAuthenticated, user.userGroups, navigate]);

  if (window.location.pathname === '/beheer') {
    return <AcDashboard store={store} />;
  }

  // Early return for organisatie routes to prevent any data loading
  if (type === 'element') {
    return null; // Will redirect via useEffect above
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

  if (type === 'organisaties' || type === 'organisatie') {
    return <ConOrganisatieDetailsPage />;
  }
  if (type === 'product') {
    return <ConProductDetailsPage />;
  }
  if (type === 'module' || type === 'applicaties' || type === 'applications') {
    return <ConModuleDetailsPage />;
  }
  if (
    type === 'moduleversie' ||
    type === 'applicatieversie' ||
    type === 'applicatiesversie'
  ) {
    return <ConModuleVersieDetailsPage />;
  }
  if (type === 'dienst' || type === 'diensten') {
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
