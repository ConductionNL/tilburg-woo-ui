import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

import { AcContainer } from '@atoms';
import { AcLoader, AcSectionsHandler } from '@components';
import ConGlossaryHighlight from '@components/con-glossary-highlight/con-glossary-highlight';

const AcContent = ({ store: { pages, user } }) => {
  const { fetchPage, get_single, loading, resetPage, shouldShowPage } = pages;

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPage(location?.pathname);
    return () => resetPage();
  }, [location]);

  if (loading.status) {
    return <AcLoader />;
  }

  // Page not found
  if (!get_single) {
    return (
      <AcContainer compact>
        <Heading level={1}>Pagina niet gevonden</Heading>
        <p>De pagina die je zoekt bestaat niet of is verwijderd.</p>
      </AcContainer>
    );
  }

  // Check if the page should be visible to the current user
  if (!shouldShowPage(get_single, user.isAuthenticated)) {
    // Page exists but user doesn't have permission to see it
    // Redirect to login if not authenticated, or show 403 if authenticated but no access
    if (!user.isAuthenticated) {
      navigate(`/login?redirect_url=${encodeURIComponent(location.pathname)}`);
      return <AcLoader />;
    } else {
      return (
        <AcContainer compact>
          <Heading level={1}>Geen toegang</Heading>
          <p>Je hebt geen toestemming om deze pagina te bekijken.</p>
        </AcContainer>
      );
    }
  }

  return (
    <ConGlossaryHighlight as='div'>
      <AcContainer compact>
        <Heading level={1}>{get_single?.name}</Heading>
        <AcSectionsHandler contents={get_single?.contents} />
      </AcContainer>
    </ConGlossaryHighlight>
  );
};

export default withStore(observer(AcContent));
