import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import { Code } from '@utrecht/component-library-react';
import { ConDynamicSidenav } from '@components';
import {
  Heading,
  Paragraph,
} from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';

const AcBeheerError = ({ title, error, store }) => {
  const headingLevel = title ? 2 : 1;
  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />
        <AcColumn gap='tiger'>
          {title && <Heading>{title}</Heading>}
          <AcColumn>
            <Heading level={headingLevel}>Er is een fout opgetreden</Heading>
            <Paragraph>
              Er kon geen verbinding worden gemaakt met de server. Probeer het later
              opnieuw.
            </Paragraph>
            <Paragraph>
              <Code>{error}</Code>
            </Paragraph>
          </AcColumn>
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerError));
