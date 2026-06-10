import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

import { Heading } from '@utrecht/component-library-react/dist/css-module';

import { AcContainer } from '@atoms';
import { AcLoader } from '@components';

const AcFallbackErrorPage = ({ store: { pages } }) => {
  const { loading } = pages;

  if (loading.status) {
    return <AcLoader />;
  }

  return (
    <AcContainer compact>
      <div className='ac-fallback-error-page-container'>
        <div className='ac-fallback-error-page-heading'>
          <Heading level={1}>Oeps! </Heading>
          <Heading level={1}>Er is iets fout gegaan.</Heading>
        </div>
        <p>
          Onze excuses voor het ongemak, maar we ondervinden technische problemen.
          Probeer het later opnieuw.
        </p>
      </div>
    </AcContainer>
  );
};

export default withStore(observer(AcFallbackErrorPage));
