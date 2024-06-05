import { useEffect } from 'react';
import {
  BreadcrumbNav,
  BreadcrumbNavLink,
  BreadcrumbNavSeparator,
} from '@utrecht/component-library-react/dist/css-module';
import { VISUALS } from '@constants';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';

const TilburgBreadcrumbs = ({ store: { pages } }) => {
  const { get_single } = pages;

  return (
    <BreadcrumbNav>
      <BreadcrumbNavLink href='/' rel='home' index={0}>
        Home
      </BreadcrumbNavLink>
      <BreadcrumbNavSeparator>
        <VISUALS.CHEVRON_RIGHT />
      </BreadcrumbNavSeparator>
      <BreadcrumbNavLink disabled current>
        {get_single.name}
      </BreadcrumbNavLink>
    </BreadcrumbNav>
  );
};

export default withStore(observer(TilburgBreadcrumbs));
