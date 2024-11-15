import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

import { AcSection, AcContainer, AcImage } from '@atoms';

const AcAbout = ({ title, content, link, image }) => {
  return (
    <AcSection className='ac-about' spacing>
      <AcContainer>
        <div className='ac-about__heading'>
          <Heading level={2}>{title}</Heading>
          <Paragraph>{content}</Paragraph>
          {link}
        </div>
        <div className='ac-about__img'>
          <AcImage {...image} />
        </div>
      </AcContainer>
    </AcSection>
  );
};

export default AcAbout;
