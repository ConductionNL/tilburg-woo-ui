import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import { AcContainer, AcSection } from '@atoms';
import { AcCardCategory, AcLink } from '@molecules';

const AcSubjects = ({ heading, paragraph, showLink = false, subjects = [] }) => (
  <AcSection className='ac-subjects' spacing>
    <AcContainer>
      <div className='ac-subjects__heading'>
        <Heading>{heading}</Heading>
        <Paragraph>{paragraph}</Paragraph>
      </div>
      <div className='ac-subjects__content'>
        {subjects.map((subject, index) => (
          <AcCardCategory key={index} {...subject} />
        ))}
      </div>
      {showLink && (
        <div className='ac-subjects__more'>
          <AcLink to='/onderwerpen' type='button'>
            <VISUALS.LIST />
            Toon alle onderwerpen
          </AcLink>
        </div>
      )}
    </AcContainer>
  </AcSection>
);

export default AcSubjects;
