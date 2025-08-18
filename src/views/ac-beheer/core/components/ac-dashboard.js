import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex, AcSection } from '@atoms';
import { ConDynamicSidenav } from '@components';

const AcDashboard = ({ store }) => {
  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <ConDynamicSidenav store={store} />

        <AcFlex column spacing='sm'>
          <div>Dashboard content will go here</div>
        </AcFlex>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcDashboard));
