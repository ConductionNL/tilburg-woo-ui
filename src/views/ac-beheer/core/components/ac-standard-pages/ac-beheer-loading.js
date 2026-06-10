import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcFlex, AcSection } from '@atoms';
import { ConDynamicSidenav, AcLoader } from '@components';
import { Heading } from '@utrecht/component-library-react/dist/css-module';
import AcColumn from '@atoms/ac-column/ac-column';

const AcBeheerLoading = ({ title, store }) => {
  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />
        <AcColumn gap='tiger'>
          <Heading>{title}</Heading>
          <AcLoader />
        </AcColumn>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcBeheerLoading));
