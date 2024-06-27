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

const TilburgBreadcrumbs = ({ store: { pages, documents } }) => {
  const { get_single: get_single_page } = pages;
  const { get_single: get_single_document } = documents;
  const location = useLocation();

  const getBreadcrumbs = useMemo(() => {
    if (location.pathname.startsWith('/publicatie/')) {
      return [
        { label: 'Zoeken', href: '/zoeken' },
        { label: get_single_document?.titel },
      ];
    }

    if (get_single_page.name) {
      return [
        {
          label: get_single_page.name,
          href: get_single_page.url,
        },
      ];
    }

    return [
      get_single_page.name ||
        Object.values(ROUTES).find((route) => route.path === location.pathname)
          ?.label || { label: 'Zoeken', href: '/zoeken' },
    ];
  }, [get_single_document, location]);

  return (
    <BreadcrumbNav>
      <BreadcrumbNavLink href='/' rel='home' index={0}>
        Home
      </BreadcrumbNavLink>
      {getBreadcrumbs.map((breadcrumb, index) => (
        <>
          <BreadcrumbNavSeparator>
            <VISUALS.CHEVRON_RIGHT />
          </BreadcrumbNavSeparator>
          <BreadcrumbNavLink
            href={breadcrumb?.href}
            disabled={index + 1 === getBreadcrumbs.length}
            current={index + 1 === getBreadcrumbs.length}
          >
            {breadcrumb?.label}
          </BreadcrumbNavLink>
        </>
      ))}
    </BreadcrumbNav>
  );
};

export default withStore(observer(TilburgBreadcrumbs));
