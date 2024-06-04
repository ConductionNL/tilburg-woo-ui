import { VISUALS } from '@constants';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { TilburgContainer, TilburgSection } from '@atoms';
import { TilburgLink } from '@molecules';

const TilburgIntro = () => {
  return (
    <TilburgSection className='tilburg-intro' spacing>
      <TilburgContainer>
        <div className='tilburg-intro__heading'>
          <Heading level={1}>
            Alle documenten van de gemeente Tilburg openbaar beschikbaar
          </Heading>
        </div>
        <div className='tilburg-intro__content'>
          <Paragraph>
            Bij gemeente Tilburg willen we transparant zijn. Alles wat we bespreken
            willen we openbaar en inzichtelijk maken voor iedereen. Op deze website
            kun je alle openbare documentatie en publicaties van de gemeente
            terugvinden.
          </Paragraph>
          <TilburgLink to='/'>
            <VISUALS.QUESTION_MARK />
            Welke documenten vind je hier?
          </TilburgLink>
        </div>
      </TilburgContainer>
    </TilburgSection>
  );
};

export default TilburgIntro;
