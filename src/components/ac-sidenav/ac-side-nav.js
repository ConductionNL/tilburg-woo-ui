import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import { useNavigate } from 'react-router';
import {
  Sidenav,
  SidenavList,
  SidenavItem,
  SidenavLink,
} from '@gemeente-denhaag/sidenav';

const AcSideNav = () => {
  const navigate = useNavigate();

  return (
    <>
      <Sidenav>
        <SidenavList>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer')}
              current={window.location.pathname === '/beheer'}
            >
              <VISUALS.CHART_LINE />
              Dashboard
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/applicaties')}
              current={window.location.pathname.startsWith('/beheer/applicaties')}
            >
              <VISUALS.CUBE />
              Applicaties
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/diensten')}
              current={window.location.pathname.startsWith('/beheer/diensten')}
            >
              <VISUALS.HAND_HOLDING />
              Diensten
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/gebruiken')}
              current={window.location.pathname.startsWith('/beheer/gebruiken')}
            >
              <VISUALS.CLOUD />
              Gebruik
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/voorzieningen-versie')}
              current={window.location.pathname.startsWith(
                '/beheer/voorzieningen-versie'
              )}
            >
              <VISUALS.INFO />
              Versie
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/overeenkomsten')}
              current={window.location.pathname.startsWith('/beheer/overeenkomsten')}
            >
              <VISUALS.HAND_SHAKE />
              Overeenkomsten
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/organisaties')}
              current={window.location.pathname.startsWith('/beheer/organisaties')}
            >
              <VISUALS.BUILDING />
              Organisaties
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/kwetsbaarheden')}
              current={window.location.pathname.startsWith('/beheer/kwetsbaarheden')}
            >
              <VISUALS.TRIANGLE_EXCLAMATION />
              Kwetsbaarheden
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/contactpersonen')}
              current={window.location.pathname.startsWith('/beheer/contactpersonen')}
            >
              <VISUALS.USERS />
              Contactpersonen
            </SidenavLink>
          </SidenavItem>
        </SidenavList>
      </Sidenav>
    </>
  );
};

export default withStore(observer(AcSideNav));
