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
            <SidenavLink current href='/#'>
              Overzicht
            </SidenavLink>
          </SidenavItem>
        </SidenavList>
        <SidenavList>
          <SidenavItem>
            <SidenavLink href='/#'>Mijn taken</SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink href='/#'>
              <SidenavLinkLabel>
                Mijn berichten
                <BadgeCounter>2</BadgeCounter>
              </SidenavLinkLabel>
            </SidenavLink>
          </SidenavItem>
          <SidenavItem>
            <SidenavLink href='/#'>Mijn lopende zaken</SidenavLink>
          </SidenavItem>
        </SidenavList>
        <SidenavList>
          <SidenavItem>
            <SidenavLink href='/#'>Mijn gegevens</SidenavLink>
          </SidenavItem>
        </SidenavList>
      </Sidenav>
    </>
  );
};

export default withStore(observer(AcSideNav));
