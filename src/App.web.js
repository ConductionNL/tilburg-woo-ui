// Imports => React
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAutoFocus, useDocumentTitleFromPath } from '@hooks';
import { AcSetDocumentTitle, AcCapitalize } from '@utils';
import loadable from '@loadable/component';
import clsx from 'clsx';

// Imports => SCSS
import '@styles/index.scss';

// Imports => Config

// Imports => Constants
import { DEFAULT_ROUTE, ROUTES, AUTHENTICATION_REQUIRED_ROUTES } from '@constants';

// Imports => Utilities
import { AcHome } from '@views';
import AcContent from '@views/ac-content/ac-content';
import { AcFallbackErrorPage } from '@views';

// Imports => Components
import AcProtectedRoute from '@components/ac-protected-route/ac-protected-route';
import { AcLoader } from '@components';

// Imports => Molecules
const AcHeader = loadable(() => import('@components/ac-header/ac-header'));
const AcFooter = loadable(() => import('@components/ac-footer/ac-footer'));

// Logout component
const AcLogout = withStore(observer(({ store }) => {
  const navigate = useNavigate();
  const { user } = store;

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Logging out user...');
        await user.logout();
        console.log('Logout successful, redirecting to home...');
        navigate('/');
      } catch (error) {
        console.error('Logout failed:', error);
        // Redirect anyway in case of error
        navigate('/');
      }
    };

    performLogout();
  }, [user, navigate]);

  return (
    <div className="ac-logout-page">
      <AcLoader />
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p>Aan het uitloggen...</p>
      </div>
    </div>
  );
}));

const App = ({ store }) => {
  const { fetchPages, all_pages, getFilteredPages } = store.pages;
  const { user } = store;
  const resetFocus = useAutoFocus();

  useEffect(() => {
    fetchPages();
  }, []);

  useDocumentTitleFromPath();

  const getView = (page) => {
    return page.slug === 'home' ? (
      <AcHome store={store} />
    ) : (
      <AcContent store={store} />
    );
  };

  const hostname = window.location.hostname;

  // Try to import container constants (generated at runtime)
  let containerConfig;
  try {
    containerConfig = require('@constants/container.constants');
  } catch (error) {
    console.warn('Container constants not available, falling back to hostname-based theme logic');
    containerConfig = null;
  }

  const getTheme = () => {
    // Use container config if available
    if (containerConfig && containerConfig.getThemeVariant) {
      const themeVariant = containerConfig.getThemeVariant();
      // Map theme variants to CSS theme classes
      switch (themeVariant) {
        case 'vng':
          return 'vng-theme';
        case 'dimpact':
          return 'dimpact-theme';
        case 'tilburg':
          return 'tilburg-theme';
        case 'rotterdam':
          return 'rotterdam-theme';
        case 'migrato':
          return 'migrato-theme';
        case 'opencatalogi':
          return 'opencatalogi-theme';
        case 'horst-aan-de-maas':
          return 'horst-aan-de-maas-theme';
        case 'venray':
          return 'venray-theme';
        case 'development':
        default:
          return 'vng-theme'; // Default for development
      }
    }

    // Fallback to hostname-based logic for production builds without container constants
    switch (hostname) {
      case 'vng.opencatalogi.nl':
      case 'acceptatie.softwarecatalogus.nl':
      case 'vng.test.opencatalogi.nl':
        return 'vng-theme';
      case 'open-tilburg.accept.commonground.nu':
      case 'opencatalogi.open-regels.nl':
        return 'tilburg-theme';
      case 'open-dimpact.accept.commonground.nu':
      case 'dimpact.opencatalogi.nl':
        return 'dimpact-theme';
      case 'open-rotterdam.accept.commonground.nu':
        return 'rotterdam-theme';
      case 'open-migrato.accept.commonground.nu':
        return 'migrato-theme';
      case 'opencatalogi.nl':
      case 'developer.opencatalogi.nl':
      case 'test.opencatalogi.nl':
        return 'opencatalogi-theme';
      case 'localhost':
        return 'vng-theme';
      case 'horstadmaas.accept.opencatalogi.nl':
        return 'horst-aan-de-maas-theme';
      case 'verwerkingsregister.horstaandemaas.nl':
        return 'horst-aan-de-maas-theme';
      case 'verwerkingsregister.venray.nl':
        return 'venray-theme';
      default:
        return 'tilburg-theme';
    }
  };

  const setTheme = () => {
    document.getElementById('body').classList.add(getTheme());
  };

  const setIcon = () => {
    switch (hostname) {
      case 'vng.opencatalogi.nl':
      case 'acceptatie.softwarecatalogus.nl':
      case 'vng.test.opencatalogi.nl':
        return (
          (document.getElementById('favicon').href =
            'https://vng.nl/themes/custom/vng/favicon.ico'),
          (document.getElementById('faviconMeta').href =
            'https://vng.nl/themes/custom/vng/favicon.ico')
        );
      case 'open-migrato.accept.commonground.nu':
        return (
          (document.getElementById('favicon').href =
            'https://www.migrato.nl/wp-content/uploads/2023/01/favicon-32x32-1.png'),
          (document.getElementById('faviconMeta').href =
            'https://www.migrato.nl/wp-content/uploads/2023/01/favicon-32x32-1.png')
        );
      case 'open-tilburg.accept.commonground.nu':
        return;
      case 'opencatalogi.open-regels.nl':
        return (
          (document.getElementById('favicon').href =
            'https://nextcloud.open-regels.nl/index.php/s/oCsbkE4FLiyPfnz/download/openregels-favicon.ico'),
          (document.getElementById('faviconMeta').href =
            'https://nextcloud.open-regels.nl/index.php/s/oCsbkE4FLiyPfnz/download/openregels-favicon.ico')
        );
      case 'open-dimpact.accept.commonground.nu':
      case 'dimpact.opencatalogi.nl':
        return (
          (document.getElementById('favicon').href =
            'https://dimpact.commonground.nu/apps/files_sharing/publicpreview/S53C7EbWtya4Kpp?file=/&fileId=938&x=3440&y=1440&a=true&etag=96ffdec8c8354f7dffe8e032f1a326b8'),
          (document.getElementById('faviconMeta').href =
            'https://dimpact.commonground.nu/apps/files_sharing/publicpreview/S53C7EbWtya4Kpp?file=/&fileId=938&x=3440&y=1440&a=true&etag=96ffdec8c8354f7dffe8e032f1a326b8')
        );
      case 'open-rotterdam.accept.commonground.nu':
        return (
          (document.getElementById('favicon').href =
            'https://www.rotterdam.nl/favicon.ico?v=2'),
          (document.getElementById('faviconMeta').href =
            'https://www.rotterdam.nl/favicon.ico?v=2')
        );
      case 'opencatalogi.nl':
      case 'developer.opencatalogi.nl':
      case 'test.opencatalogi.nl':
        return (
          (document.getElementById('favicon').href =
            'https://directory.opencatalogi.nl/core/preview?fileId=309&x=2048&y=1280&a=true&etag=bab799ba75481f8107c967e49e50c008'),
          (document.getElementById('faviconMeta').href =
            'https://directory.opencatalogi.nl/core/preview?fileId=309&x=2048&y=1280&a=true&etag=bab799ba75481f8107c967e49e50c008')
        );
      case 'localhost':
        return (
          (document.getElementById('favicon').href =
            'https://directory.opencatalogi.nl/core/preview?fileId=309&x=2048&y=1280&a=true&etag=bab799ba75481f8107c967e49e50c008'),
          (document.getElementById('faviconMeta').href =
            'https://directory.opencatalogi.nl/core/preview?fileId=309&x=2048&y=1280&a=true&etag=bab799ba75481f8107c967e49e50c008')
        );
      case 'horstadmaas.accept.opencatalogi.nl':
      case 'verwerkingsregister.horstaandemaas.nl':
        return (
          (document.getElementById('favicon').href =
            'https://horstadmaas.accept.commonground.nu/s/r6KETEADerdekdK/download'),
          (document.getElementById('faviconMeta').href =
            'https://horstadmaas.accept.commonground.nu/s/r6KETEADerdekdK/download')
        );
      case 'verwerkingsregister.venray.nl':
        return (
          (document.getElementById('favicon').href =
            'https://www.venray.nl/images/favicon7bb51a2860262bb4.ico'),
          (document.getElementById('faviconMeta').href =
            'https://www.venray.nl/images/favicon7bb51a2860262bb4.ico')
        );
      default:
        return;
    }
  };

  useEffect(() => {
    setIcon();
    setTheme();
  }, []);

  if (!all_pages?.length) {
    return (
      <div className={'ac-app-container'} tabIndex='-1' ref={resetFocus}>
        <AcHeader store={store} />
        <main id='main' className='ac-app-main'>
          <AcFallbackErrorPage />
        </main>
        <AcFooter />
      </div>
    );
  }

  return (
    <div className={'ac-app-container'} tabIndex='-1' ref={resetFocus}>
      <AcHeader store={store} />
      <main id='main' className='ac-app-main'>
        <Routes>
          {/* CMS-driven pages */}
          {getFilteredPages(user.isAuthenticated).map((page) => (
            <Route
              key={`route-${page.id}`}
              path={page.slug}
              element={getView(page)}
            />
          ))}
          
          {/* Static routes */}
          {Object.values(ROUTES)
            .filter((route) => route.component)
            .map((route) => {
              // Check if this route requires authentication
              const requiresAuth = AUTHENTICATION_REQUIRED_ROUTES.includes(route.path);
              
              return (
                <Route
                  key={`default-route-${route.id}`}
                  path={route.path}
                  element={
                    requiresAuth ? (
                      <AcProtectedRoute requireAuth={true} fallbackPath="/login">
                        <route.component store={store} />
                      </AcProtectedRoute>
                    ) : (
                      <route.component store={store} />
                    )
                  }
                />
              );
            })}
            
          {/* Logout route */}
          <Route
            key="logout-route"
            path="/logout"
            element={<AcLogout store={store} />}
          />
          
          {/* Fallback route */}
          <Route
            key={`default-route-${DEFAULT_ROUTE.id}`}
            path={'*'}
            element={<AcHome store={store} />}
          />
        </Routes>
      </main>
      <AcFooter />
    </div>
  );
};

export default withStore(observer(App));
