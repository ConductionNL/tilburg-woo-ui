import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { AcFlex, AcSection } from '@atoms';
import { AcSideNav } from '@components';


const AcDashboard = () => {

  return (
    <AcSection spacing className='ac-mijn-omgeving-section'>
      <AcFlex spacing='xl'>
        <AcSideNav />

        <AcFlex column spacing='sm'>
          <div>Dashboard content will go here</div>
        </AcFlex>
      </AcFlex>
    </AcSection>
  );
};

export default withStore(observer(AcDashboard));
