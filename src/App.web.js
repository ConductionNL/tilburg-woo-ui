// Imports => React
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAutoFocus, useDocumentTitleFromPath } from '@hooks';
import { AcSetDocumentTitle, AcCapitalize } from '@utils';
import loadable from '@loadable/component';

// Imports => SCSS
import '@styles/index.scss';

// Imports => Config

// Imports => Constants
import { DEFAULT_ROUTE, ROUTES } from '@constants';

// Imports => Utilities
import { AcHome } from '@views';
import AcContent from '@views/ac-content/ac-content';

// Imports => Molecules
const AcHeader = loadable(() => import('@components/ac-header/ac-header'));
const AcFooter = loadable(() => import('@components/ac-footer/ac-footer'));

const App = ({ store }) => {
  const { fetchPages, all_pages } = store.pages;
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

  if (!all_pages?.length) {
    return null;
  }

  return (
    <div className='tilburg-theme' tabIndex='-1' ref={resetFocus}>
      <AcHeader store={store} />
      <main id='main'>
        <Routes>
          {all_pages.map((page) => (
            <Route
              key={`route-${page.id}`}
              path={page.slug}
              element={getView(page)}
            />
          ))}
          {Object.values(ROUTES)
            .filter((route) => route.component)
            .map((route) => (
              <Route
                key={`default-route-${route.id}`}
                path={route.path}
                element={<route.component store={store} />}
              />
            ))}
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
