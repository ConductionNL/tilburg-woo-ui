import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';

import { AcLink } from '@molecules';
import { AcSection, AcContainer } from '@atoms';

const AcAbout = () => {
  return (
    <AcSection className='ac-about' spacing>
      <AcContainer>
        <div className='ac-about__heading'>
          <Heading level={2}>Over Open Tilburg</Heading>
          <Paragraph>
            Bij gemeente Tilburg willen we transparant zijn. Alles wat we bespreken
            willen we openbaar en inzichtelijk maken voor iedereen. Op deze website
            kun je alle openbare documentatie en publicaties terugvinden.
            <ul className='ac-usps'>
              <li>Alles op één centrale plek</li>
              <li>Zoek in 23.420 publicaties</li>
              <li>Direct documenten downloaden</li>
            </ul>
          </Paragraph>
          <AcLink to='/over-ons'>Meer over deze website</AcLink>
        </div>
        <div className='ac-about__img'>
          <img src='about-tilburg-placeholder.png' alt='' />
        </div>
      </AcContainer>
    </AcSection>
  );
};

export default AcAbout;
