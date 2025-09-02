import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useLocation } from 'react-router-dom';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

import { AcContainer } from '@atoms';
import { AcLoader, AcSectionsHandler } from '@components';

const AcContent = ({ store: { pages, user } }) => {
  const { fetchPage, get_single, loading, resetPage, shouldShowPage } = pages;

  const location = useLocation();

  useEffect(() => {
    fetchPage(location?.pathname);
    return () => resetPage();
  }, [location]);

  if (loading.status) {
    return <AcLoader />;
  }

  // Check if the page should be visible to the current user
  if (get_single && !shouldShowPage(get_single, user.isAuthenticated)) {
    // Page exists but user doesn't have permission to see it
    // Redirect to login if not authenticated, or show 403 if authenticated but no access
    if (!user.isAuthenticated) {
      window.location.href = `/login?redirect_url=${encodeURIComponent(location.pathname)}`;
      return <AcLoader />;
    } else {
      return (
        <AcContainer compact>
          <Heading level={1}>Access Denied</Heading>
          <p>You don&apos;t have permission to view this page.</p>
        </AcContainer>
      );
    }
  }

  return (
    <AcContainer compact>
      <Heading level={1}>{get_single?.name}</Heading>
      <AcSectionsHandler contents={get_single?.contents} />
      {/* TODO: needs to be fixed to NOT rely on AcAuthentication */}
      {/* {get_single?.slug === 'login' ? <AcAuthentication /> : <></>} */}
    </AcContainer>
  );
};

export default withStore(observer(AcContent));
