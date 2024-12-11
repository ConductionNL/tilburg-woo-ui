import { useEffect } from 'react';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useLocation } from 'react-router-dom';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

import { AcContainer } from '@atoms';
import { AcLoader, AcSectionsHandler } from '@components';
import AcAuthentication from '@views/ac-authentication/ac-authentication';

const AcContent = ({ store: { pages } }) => {
  const { fetchPage, get_single, loading, resetPage } = pages;

  const location = useLocation();

  useEffect(() => {
    fetchPage(location?.pathname);
    return () => resetPage();
  }, [location]);

  if (loading.status) {
    return <AcLoader />;
  }

  return (
    <AcContainer compact>
      <Heading level={1}>{get_single?.name}</Heading>
      <AcSectionsHandler contents={get_single?.contents} />
      {get_single?.slug === 'login' ? <AcAuthentication /> : <></>}
    </AcContainer>
  );
};

export default withStore(observer(AcContent));
