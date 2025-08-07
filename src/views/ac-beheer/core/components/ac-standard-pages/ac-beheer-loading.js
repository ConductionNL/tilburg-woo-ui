import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import { AcSideNav, AcLoader } from '@components';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';

const AcBeheerLoading = ({ title }) => {
  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <AcSideNav />
        <AcColumn gap='tiger'>
          <Heading>{title}</Heading>
          <AcLoader />
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerLoading));
