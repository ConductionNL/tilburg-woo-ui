import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';

import { withStore } from '@stores';
import { BREADCRUMBS, VISUALS } from '@constants';

import {
  BreadcrumbNav,
  BreadcrumbNavLink,
  BreadcrumbNavSeparator,
} from '@utrecht/component-library-react/dist/css-module';

const AcBreadcrumbs = ({ store: { pages, publications, gemma } }) => {
  const { get_single: get_single_page } = pages;
  const { get_single: get_single_document } = publications;
  const { view: single_view } = gemma;
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (event, href, disabled = false) => {
    if (href && !disabled) {
      event.preventDefault();
      navigate(href);
    } else if (disabled) {
      // Prevent navigation for disabled/current breadcrumb
      event.preventDefault();
    }
  };

  // split up the pathname into an array
  const pathnames = location.pathname.split('/');

  // pretify the pathname
  const prettifyPathname = (name, adition) =>
    name &&
    name.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) +
      (adition ? ` ${adition}` : '');

  const getBreadcrumbs = useMemo(() => {
    if (location.pathname.startsWith('/zoeken')) {
      return BREADCRUMBS.SEARCH(searchParams.get('search'));
    }

    if (location.pathname.startsWith('/publicatie/')) {
      const schema = get_single_document?.['@self']?.schema;
      return BREADCRUMBS.PUBLICATION(get_single_document?.title, schema);
    }

    if (location.pathname.startsWith('/onderwerpen')) {
      return BREADCRUMBS.THEMES;
    }

    if (location.pathname.startsWith('/directory')) {
      return BREADCRUMBS.DIRECTORY;
    }

    if (location.pathname.startsWith('/login')) {
      return BREADCRUMBS.LOGIN;
    }

    if (location.pathname.startsWith('/reminder')) {
      return BREADCRUMBS.FORGOT_PASSWORD;
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

    if (location.pathname.startsWith('/beheer/my-account')) {
      return BREADCRUMBS.BEHEER_MY_ACCOUNT;
    }
    if (location.pathname.startsWith('/beheer/my-organisation')) {
      return BREADCRUMBS.BEHEER_MY_ORGANISATION;
    }

    const isViewDetailPath =
      location.pathname.startsWith('/beheer/view/') ||
      (location.pathname.startsWith('/beheer/views/') && !!pathnames[3]);
    if (isViewDetailPath) {
      const viewName =
        single_view?.titelViewSwc?.trim() ||
        single_view?.name ||
        single_view?.['@self']?.name;
      return BREADCRUMBS.BEHEER_VIEW_DETAIL(viewName);
    }

    if (location.pathname.startsWith(`/beheer/${pathnames[2]}`)) {
      const detailPathName = pathnames[3]?.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
        ? 'Details'
        : prettifyPathname(pathnames[3]);

      return BREADCRUMBS.BEHEER_LIST(pathnames[2], detailPathName);
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

    if (location.pathname.startsWith('/forms')) {
      return BREADCRUMBS.BEHEER(prettifyPathname(pathnames[2], 'formulier'));
    }

    if (get_single_page?.name) {
      return BREADCRUMBS.CONTENT(get_single_page.name);
    }

    if (get_single_page?.title) {
      return BREADCRUMBS.CONTENT(get_single_page.title);
    }

    if (location.pathname.startsWith('/account')) {
      return BREADCRUMBS.MY_ACCOUNT;
    }

    return [];
  }, [get_single_document, get_single_page, location, single_view]);

  return (
    <BreadcrumbNav aria-label='Kruimelpad'>
      <BreadcrumbNavLink
        href='/'
        rel='home'
        index={0}
        onClick={(event) => handleBreadcrumbClick(event, '/')}
      >
        Home
      </BreadcrumbNavLink>
      {getBreadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={index}>
          <BreadcrumbNavSeparator>
            <VISUALS.CHEVRON_RIGHT />
          </BreadcrumbNavSeparator>
          <BreadcrumbNavLink
            href={breadcrumb?.href}
            disabled={index + 1 === getBreadcrumbs.length}
            current={index + 1 === getBreadcrumbs.length}
            onClick={(event) =>
              handleBreadcrumbClick(
                event,
                breadcrumb?.href,
                index + 1 === getBreadcrumbs.length
              )
            }
          >
            {breadcrumb?.label}
          </BreadcrumbNavLink>
        </React.Fragment>
      ))}
    </BreadcrumbNav>
  );
};

export default withStore(observer(AcBreadcrumbs));
