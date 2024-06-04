import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useLocation } from 'react-router-dom';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

import { TilburgContainer } from '@atoms';
import { TilburgLoader, TilburgSectionsHandler } from '@components';

const AcContent = ({ store: { pages } }) => {
  const { fetchPage, get_single, loading, resetPage } = pages;

  const location = useLocation();

  useEffect(() => {
    resetPage();
    fetchPage(location?.pathname);
  }, [location]);

  if (loading.status) {
    return <TilburgLoader />;
  }

  return (
    <TilburgContainer compact>
      <Heading level={1}>{get_single?.name}</Heading>
      <TilburgSectionsHandler contents={get_single?.contents} />
    </TilburgContainer>
  );
};

export default withStore(observer(AcContent));
