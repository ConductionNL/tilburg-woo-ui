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
          <Heading level={1}>Oops! </Heading>
          <Heading level={1}>Something went wrong.</Heading>
        </div>
        <p>
          We apologize for the inconvenience, but we're experiencing technical
          issues. Please try again later.
        </p>
      </div>
    </AcContainer>
  );
};

export default withStore(observer(AcFallbackErrorPage));
