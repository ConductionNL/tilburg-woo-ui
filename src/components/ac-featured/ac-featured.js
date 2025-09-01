import { Heading } from '@utrecht/component-library-react/dist/css-module';

import { AcSection, AcContainer } from '@atoms';
import { AcSearchResult } from '@molecules';
import { LABELS } from '@src/constants';

const AcFeatured = () => {
  return (
    <AcSection className='ac-featured' spacing>
      <AcContainer>
        <div className='ac-featured__heading'>
          <Heading>{LABELS.HIGHLIGHTED}</Heading>
        </div>
        <div className='ac-featured__content'>
          <AcSearchResult />
          <AcSearchResult />
          <AcSearchResult />
        </div>
      </AcContainer>
    </AcSection>
  );
};

export default AcFeatured;
