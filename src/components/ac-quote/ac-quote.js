import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

import { AcSection, AcContainer } from '@atoms';

const AcQuote = ({ title, subtitle }) => {
  if (!title) return null;

  return (
    <AcSection className='ac-quote' spacing>
      <AcContainer>
        <blockquote className='ac-quote__content'>
          <Heading level={2}>{title}</Heading>
          {subtitle && <Paragraph>{subtitle}</Paragraph>}
        </blockquote>
      </AcContainer>
    </AcSection>
  );
};

export default AcQuote;
