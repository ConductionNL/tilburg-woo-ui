import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

import { AcLink } from '@molecules';
import { AcSection, AcContainer, AcRichText } from '@atoms';
import { AcSanitizeHtml } from '@utils';

const AcAbout = ({ title, content, link }) => {
  return (
    <AcSection className='ac-about' spacing>
      <AcContainer>
        <div className='ac-about__heading'>
          <Heading level={2}>{title}</Heading>
          <Paragraph>{content}</Paragraph>
          {link}
        </div>
        <div className='ac-about__img'>
          <img src='about-tilburg-placeholder.png' alt='' />
        </div>
      </AcContainer>
    </AcSection>
  );
};

export default AcAbout;
