import { VISUALS } from '@constants';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import { AcContainer, AcFlex, AcRichText, AcSection } from '@atoms';

const hostname = window.location.hostname;

const AcIntro = ({ title, content, link }) => {
  return (
    <AcSection className='ac-intro' spacing>
      <AcContainer>
        <div className='ac-intro__heading'>
          <Heading level={1}>{title}</Heading>
        </div>
        <div className='ac-intro__content'>
          <Paragraph>{content}</Paragraph>
          <AcFlex spacing={'xs'} alignItems={'center'}>
            {hostname === 'vng.opencatalogi.nl' ? (
              <VISUALS.QUESTION_MARK_VNG />
            ) : (
              <VISUALS.QUESTION_MARK />
            )}
            <AcRichText content={link}></AcRichText>
          </AcFlex>
        </div>
      </AcContainer>
    </AcSection>
  );
};

export default AcIntro;
