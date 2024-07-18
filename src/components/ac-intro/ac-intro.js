import { VISUALS } from '@constants';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcContainer, AcSection } from '@atoms';
import { AcLink } from '@molecules';

const AcIntro = () => {
  return (
    <AcSection className='ac-intro' spacing>
      <AcContainer>
        <div className='ac-intro__heading'>
          <Heading level={1}>
            Alle documenten van de gemeente Tilburg openbaar beschikbaar
          </Heading>
        </div>
        <div className='ac-intro__content'>
          <Paragraph>
            Bij gemeente Tilburg willen we transparant zijn. Alles wat we bespreken
            willen we openbaar en inzichtelijk maken voor iedereen. Op deze website
            kun je alle openbare documentatie en publicaties van de gemeente
            terugvinden.
          </Paragraph>
          <AcLink to='/'>
            <VISUALS.QUESTION_MARK />
            Welke documenten vind je hier?
          </AcLink>
        </div>
      </AcContainer>
    </AcSection>
  );
};

export default AcIntro;
