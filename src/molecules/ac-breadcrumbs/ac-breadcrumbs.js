import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useSearchParams } from 'react-router-dom';

import { withStore } from '@stores';
import { BREADCRUMBS, VISUALS } from '@constants';

import {
  BreadcrumbNav,
  BreadcrumbNavLink,
  BreadcrumbNavSeparator,
} from '@utrecht/component-library-react/dist/css-module';

const AcBreadcrumbs = ({ store: { pages, publications, gemma }, items }) => {
  const { get_single: get_single_page } = pages;
  const { get_single: get_single_document } = publications;
  const { view: single_view } = gemma;
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // split up the pathname into an array
  const pathnames = location.pathname.split('/');

  // pretify the pathname
  const prettifyPathname = (name) => name && name.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  const getBreadcrumbs = useMemo(() => {
    if (location.pathname.startsWith('/zoeken')) {
      return BREADCRUMBS.SEARCH(searchParams.get('search'));
    }

    if (location.pathname.startsWith('/publicatie/')) {
      return BREADCRUMBS.PUBLICATION(get_single_document?.title);
    }

    if (location.pathname.startsWith('/onderwerpen')) {
      return BREADCRUMBS.THEMES;
    }

    if (location.pathname.startsWith('/login')) {
      return BREADCRUMBS.LOGIN;
    }

    if (location.pathname.startsWith('/mijn-omgeving')) {
      return BREADCRUMBS.MIJN_OMGEVING;
    }

    if (location.pathname.startsWith('/gemma')) {
      return BREADCRUMBS.GEMMA;
    }

    if (location.pathname.startsWith('/login')) {
      return BREADCRUMBS.NEXTCLOUD_LOGIN;
    }

    if (location.pathname.startsWith(`/beheer/${pathnames[2]}`)) {
      return BREADCRUMBS.BEHEER_LIST(pathnames[2], pathnames[3]);
    }

    if (location.pathname.startsWith('/beheer')) {
      return BREADCRUMBS.BEHEER(prettifyPathname(pathnames[2]));
    }

    if (location.pathname.startsWith('/register')) {
      return BREADCRUMBS.REGISTER;
    }

    if (location.pathname.startsWith('/views')) {
      return BREADCRUMBS.VIEWS(single_view?.name);
    }

    if (get_single_page?.name) {
      return BREADCRUMBS.CONTENT(get_single_page.name);
    }

    return [];
  }, [get_single_document, get_single_page, location, single_view]);

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

export default withStore(observer(AcBreadcrumbs));
