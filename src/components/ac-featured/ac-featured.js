import { Heading } from '@utrecht/component-library-react/dist/css-module';
import { LABELS } from '@constants';

import { AcSection, AcContainer } from '@atoms';
import AcGrid from '@atoms/ac-grid/ac-grid';
import { AcSearchResult } from '@molecules';

const AcFeatured = ({ publications = [], isLoading = false }) => {
  console.log('publications', publications);

  return (
    <AcSection className='ac-featured' spacing>
      <AcContainer>
        <div className='ac-featured__heading'>
          <Heading level={2}>{LABELS.HIGHLIGHTED}</Heading>
          <br />
        </div>
        <div className='ac-featured__content'>
          <AcGrid row={3}>
            {isLoading
              ? // Show skeleton loaders while loading
                Array.from({ length: 3 }).map((_, index) => (
                  <AcSearchResult skeleton key={index} />
                ))
              : // Show publications when loaded
                publications.map((item, index) => (
                  <AcSearchResult
                    key={item.id || index}
                    {...item}
                    // Override props to hide category and themes on homepage
                    hideCategory={true}
                    hideEllipses={true}
                  />
                ))}
          </AcGrid>
        </div>
      </AcContainer>
    </AcSection>
  );
};

export default AcFeatured;
