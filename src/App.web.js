// Imports => React
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { Route, Routes, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAutoFocus, useDocumentTitleFromPath } from '@hooks';
import loadable from '@loadable/component';

// Imports => SCSS
import '@styles/index.scss';

// Imports => Config

// Imports => Constants
import { DEFAULT_ROUTE, ROUTES, AUTHENTICATION_REQUIRED_ROUTES, LABELS, VISUALS } from '@constants';

// Imports => Utilities
import { AcHome, AcFallbackErrorPage } from '@views';
import AcContent from '@views/ac-content/ac-content';

// Imports => Components
import AcProtectedRoute from '@components/ac-protected-route/ac-protected-route';
import { AcLoader } from '@components';
import ConGlossaryDrawer from '@components/con-glossary-drawer/con-glossary-drawer';

// Imports => Molecules
const AcHeader = loadable(() => import('@components/ac-header/ac-header'));
const AcFooter = loadable(() => import('@components/ac-footer/ac-footer'));

// Logout component
const AcLogout = withStore(
  observer(({ store }) => {
    const navigate = useNavigate();
    const { user } = store;

    useEffect(() => {
      const performLogout = async () => {
        try {
          console.info('Logging out user...');
          await user.logout();
          console.info('Logout successful, redirecting to home...');
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
      <div className='ac-logout-page'>
        <AcLoader />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p>Aan het uitloggen...</p>
        </div>
      </div>
    );
  })
);

const App = ({ store }) => {
  const { user, glossary } = store;
  const resetFocus = useAutoFocus();
  const location = useLocation();
  const isBeheerPage = location.pathname.startsWith('/beheer');

  // Names cache warmup removed - names are now efficiently loaded via _extend=_names
  // on search and collection endpoints, eliminating the need for bulk fetching

  // Warm up schema cache only when user is authenticated AND on public pages
  // Skip on authenticated-only routes (/beheer, /forms, /account) since those pages already fetch schemas
  useEffect(() => {
    const pathname = window.location.pathname;
    const isAuthenticatedRoute =
      pathname.startsWith('/beheer') ||
      pathname.startsWith('/forms') ||
      pathname.startsWith('/account');

    if (user.isAuthenticated && !isAuthenticatedRoute) {
      store.object.warmupSchemaCache().catch((error) => {
        console.warn(
          '⚠️ Schema cache warmup failed during app initialization:',
          error
        );
      });

      // Warm up register cache in background for better UX
      store.object.warmupRegisterCache().catch((error) => {
        console.warn(
          '⚠️ Register cache warmup failed during app initialization:',
          error
        );
      });
    }
  }, [user.isAuthenticated]);

  // Warm up glossary terms on app init (public API, no auth required)
  useEffect(() => {
    store.glossary.warmup().catch((error) => {
      console.warn('Glossary warmup failed during app initialization:', error);
    });
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
    console.warn(
      'Container constants not available, falling back to hostname-based theme logic'
    );
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

  const getFaviconUrl = () => {
    // Use container config if available
    if (containerConfig && containerConfig.getFaviconUrl) {
      const faviconUrl = containerConfig.getFaviconUrl();
      if (faviconUrl) {
        return faviconUrl;
      }
    }

    // Fallback to hostname-based logic
    switch (hostname) {
      case 'softwarecatalogus.accept.opencatalogi.nl':
      case 'acceptatie.softwarecatalogus.nl':
      case 'softwarecatalogus.test.opencatalogi.nl':
        return 'https://vng.nl/themes/custom/vng/favicon.ico';
      case 'open-migrato.accept.commonground.nu':
        return 'https://www.migrato.nl/wp-content/uploads/2023/01/favicon-32x32-1.png';
      case 'opencatalogi.open-regels.nl':
        return 'https://nextcloud.open-regels.nl/index.php/s/oCsbkE4FLiyPfnz/download/openregels-favicon.ico';
      case 'open-dimpact.accept.commonground.nu':
      case 'dimpact.opencatalogi.nl':
        return 'https://dimpact.commonground.nu/apps/files_sharing/publicpreview/S53C7EbWtya4Kpp?file=/&fileId=938&x=3440&y=1440&a=true&etag=96ffdec8c8354f7dffe8e032f1a326b8';
      case 'open-rotterdam.accept.commonground.nu':
        return 'https://www.rotterdam.nl/favicon.ico?v=2';
      case 'opencatalogi.nl':
      case 'developer.opencatalogi.nl':
      case 'test.opencatalogi.nl':
      case 'localhost':
        return 'https://directory.opencatalogi.nl/core/preview?fileId=309&x=2048&y=1280&a=true&etag=bab799ba75481f8107c967e49e50c008';
      case 'horstadmaas.accept.opencatalogi.nl':
      case 'verwerkingsregister.horstaandemaas.nl':
        return 'https://horstadmaas.accept.commonground.nu/s/r6KETEADerdekdK/download';
      case 'verwerkingsregister.venray.nl':
        return 'https://www.venray.nl/images/favicon7bb51a2860262bb4.ico';
      case 'open-tilburg.accept.commonground.nu':
      default:
        return null; // Use default favicon from public directory
    }
  };

  const setIcon = () => {
    const faviconUrl = getFaviconUrl();

    if (faviconUrl) {
      document.getElementById('favicon').href = faviconUrl;
      document.getElementById('faviconMeta').href = faviconUrl;
    }
  };

  useEffect(() => {
    setIcon();
    setTheme();
  }, []);

  return (
    <div className={'ac-app-container'} tabIndex='-1' ref={resetFocus}>
      <AcHeader store={store} />
      <main id='main' className='ac-app-main'>
        <Routes>
          {/* Static routes - these take precedence over catch-all */}
          {Object.values(ROUTES)
            .filter((route) => route.component || route.redirectTo)
            .map((route) => {
              // Handle redirect routes
              if (route.redirectTo) {
                return (
                  <Route
                    key={`redirect-route-${route.id}`}
                    path={route.path}
                    element={<Navigate to={route.redirectTo} replace />}
                  />
                );
              }

              // Check if this route requires authentication
              const requiresAuth = AUTHENTICATION_REQUIRED_ROUTES.includes(
                route.path
              );

              return (
                <Route
                  key={`default-route-${route.id}`}
                  path={route.path}
                  element={
                    requiresAuth ? (
                      <AcProtectedRoute requireAuth={true} fallbackPath='/login'>
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
            key='logout-route'
            path='/logout'
            element={<AcLogout store={store} />}
          />

          {/* Catch-all route for CMS pages - fetches on demand */}
          <Route
            key='cms-pages-catchall'
            path='*'
            element={<AcContent store={store} />}
          />
        </Routes>
      </main>
      {!isBeheerPage && glossary.is_warmed_up && glossary.all_terms.length > 0 && (
        <div className='con-glossary-button-container'>
          <button
            className='con-glossary-button'
            onClick={() => glossary.openDrawer()}
            aria-label={LABELS.CONCEPTS_LIST}
          >
            <VISUALS.LIST_ALT />
            <span>{LABELS.CONCEPTS_LIST}</span>
          </button>
        </div>
      )}
      <ConGlossaryDrawer />
      <AcFooter />
    </div>
  );
};

export default withStore(observer(App));
