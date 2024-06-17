import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation } from 'react-router-dom';

import { withStore } from '@stores';
import { ROUTES, VISUALS } from '@constants';

import {
  BreadcrumbNav,
  BreadcrumbNavLink,
  BreadcrumbNavSeparator,
} from '@utrecht/component-library-react/dist/css-module';

const TilburgBreadcrumbs = ({ store: { pages } }) => {
  const { get_single, is_loading } = pages;
  const location = useLocation();

  const getCurrentPageTitle = useMemo(
    () =>
      get_single.name ||
      Object.values(ROUTES).find((route) => route.path === location.pathname)
        ?.label ||
      'Zoeken',
    [is_loading]
  );

  return (
    <BreadcrumbNav>
      <BreadcrumbNavLink href='/' rel='home' index={0}>
        Home
      </BreadcrumbNavLink>
      <BreadcrumbNavSeparator>
        <VISUALS.CHEVRON_RIGHT />
      </BreadcrumbNavSeparator>
      <BreadcrumbNavLink disabled current>
        {getCurrentPageTitle}
      </BreadcrumbNavLink>
    </BreadcrumbNav>
  );
};

export default withStore(observer(TilburgBreadcrumbs));
