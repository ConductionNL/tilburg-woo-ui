import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import { TilburgContainer, TilburgSection } from '@atoms';
import { TilburgCardCategory, TilburgLink } from '@molecules';

const TilburgSubjects = ({
  heading,
  paragraph,
  showLink = false,
  subjects = [],
}) => (
  <TilburgSection className='tilburg-subjects' spacing>
    <TilburgContainer>
      <div className='tilburg-subjects__heading'>
        <Heading>{heading}</Heading>
        <Paragraph>{paragraph}</Paragraph>
      </div>
      <div className='tilburg-subjects__content'>
        {subjects.map((subject, index) => (
          <TilburgCardCategory key={index} {...subject} />
        ))}
      </div>
      {showLink && (
        <div className='tilburg-subjects__more'>
          <TilburgLink to='/onderwerpen' type='button'>
            <VISUALS.LIST />
            Toon alle onderwerpen
          </TilburgLink>
        </div>
      )}
    </TilburgContainer>
  </TilburgSection>
);

export default TilburgSubjects;
