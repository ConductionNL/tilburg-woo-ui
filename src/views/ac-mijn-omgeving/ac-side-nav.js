import { observer } from 'mobx-react-lite';
import { withStore } from '@stores';
import { VISUALS } from '@constants';
import {
  Textbox,
  PrimaryActionButton,
  BadgeCounter,
} from '@utrecht/component-library-react/dist/css-module';
import { useNavigate } from 'react-router';
import {
  Sidenav,
  SidenavList,
  SidenavItem,
  SidenavLink,
  SidenavLinkLabel,
} from '@gemeente-denhaag/components-react';

const AcSideNav = () => {
  const navigate = useNavigate();

  const onSubmit = () => {
    navigate('/mijn-omgeving');
  };

  return (
    <>
      <Sidenav>
        <SidenavList>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/mijn-omgeving')}
              current={window.location.pathname.startsWith('/mijn-omgeving')}
            >
              <VISUALS.USERS />
              Dashboard
            </SidenavLink>
          </SidenavItem>
          {/* <SidenavItem>
            <SidenavLink>
              <VISUALS.USERS />
              Gebruikers
            </SidenavLink>
          </SidenavItem> */}
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/voorzieningen')}
              current={
                window.location.pathname.startsWith('/beheer/voorzieningen/') ||
                window.location.pathname === '/beheer/voorzieningen'
              }
            >
              <VISUALS.CUBE />
              Voorzieningen
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/voorzieningen-aanbod')}
              current={window.location.pathname.startsWith(
                '/beheer/voorzieningen-aanbod'
              )}
            >
              <VISUALS.HAND_HOLDING />
              Aanbod
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink
              onClick={() => navigate('/beheer/voorzieningen-gebruik')}
              current={window.location.pathname.startsWith(
                '/beheer/voorzieningen-gebruik'
              )}
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
              onClick={() => navigate('/beheer/contracten')}
              current={window.location.pathname.startsWith('/beheer/contracten')}
            >
              <VISUALS.HAND_SHAKE />
              Contracten
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
        </SidenavList>
      </Sidenav>
    </>
  );
};

export default withStore(observer(AcSideNav));
