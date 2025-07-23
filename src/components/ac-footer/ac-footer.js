import { AcContainer, ConLogo } from '@atoms';
import { LABELS, VISUALS } from '@constants';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';
import {
  FOOTER_PRIMARY_ABOUT,
  FOOTER_PRIMARY_QUICK,
  FOOTER_SECONDARY,
  VNG_FOOTER_ITEMS_SITEMAP,
  VNG_FOOTER_ITEMS_INFORMATIE,
  VNG_FOOTER_ITEMS_BEDRIJVEN,
  DIMPACT_FOOTER_ITEMS_WHAT_WE_DO,
  DIMPACT_FOOTER_ITEMS_WHO_WE_ARE,
  DIMPACT_FOOTER_ITEMS_INFORMATION,
} from '@constants/routes.constants';
import { Link } from 'react-router-dom';

const AcFooter = ({ store: { menu } }) => {
  const { all_menu_items } = menu;

  // Icon component for finding icons based on a variable
  const Icon = ({ icon }) => {
    const Icon = VISUALS[icon];
    if (!Icon) return <></>;
    return <Icon className='ac-footer__link-icon' />;
  };

  const renderLink = (item) => {
    const linkContent = item.isExternal ? (
      <a href={item.href} target='_blank' rel='noopener noreferrer'>
        {item.label}
        <span className='sr-only'>Opent in een nieuw tabblad</span>
        <VISUALS.EXTERNAL_LINK />
      </a>
    ) : (
      <Link to={item.path}>{item.label}</Link>
    );

    return <li key={item.id}>{linkContent}</li>;
  };

  const getFooterItems = () => {
    const hostname = window.location.hostname;

    switch (hostname) {
      case 'vng.opencatalogi.nl':
      case 'acceptatie.softwarecatalogus.nl':
        return [
          VNG_FOOTER_ITEMS_SITEMAP,
          VNG_FOOTER_ITEMS_INFORMATIE,
          VNG_FOOTER_ITEMS_BEDRIJVEN,
        ];
      case 'open-tilburg.accept.commonground.nu':
        return [
          VNG_FOOTER_ITEMS_SITEMAP,
          VNG_FOOTER_ITEMS_INFORMATIE,
          VNG_FOOTER_ITEMS_BEDRIJVEN,
        ];
      case 'open-dimpact.accept.commonground.nu':
      case 'dimpact.opencatalogi.nl':
        return [
          DIMPACT_FOOTER_ITEMS_WHAT_WE_DO,
          DIMPACT_FOOTER_ITEMS_WHO_WE_ARE,
          DIMPACT_FOOTER_ITEMS_INFORMATION,
        ];
      case 'open-rotterdam.accept.commonground.nu':
        return [
          VNG_FOOTER_ITEMS_SITEMAP,
          VNG_FOOTER_ITEMS_INFORMATIE,
          VNG_FOOTER_ITEMS_BEDRIJVEN,
        ];
      case 'localhost':
        return [
          VNG_FOOTER_ITEMS_SITEMAP,
          VNG_FOOTER_ITEMS_INFORMATIE,
          VNG_FOOTER_ITEMS_BEDRIJVEN,
        ];
      default:
        return [
          VNG_FOOTER_ITEMS_SITEMAP,
          VNG_FOOTER_ITEMS_INFORMATIE,
          VNG_FOOTER_ITEMS_BEDRIJVEN,
        ];
    }
  };

  const hostname = window.location.hostname;

  const footerItems = all_menu_items.filter((item) =>
    hostname === 'horstadmaas.accept.opencatalogi.nl'
      ? item.position > 1
      : item.position > 2
  );

  return (
    <footer className='ac-footer'>
      <h2 className='sr-only'>Footer</h2>
      <section>
        <AcContainer
          className={AcCheckIfSpecificHostname() ? 'ac-footer__container' : ''}
        >
          {AcCheckIfSpecificHostname() ? (
            <>
              {footerItems.map((footerItem, index) => (
                <nav
                  className='ac-footer__links'
                  key={`footer-menu-${index + 1}`}
                  aria-label={`Footer menu ${index + 1}`}
                >
                  {footerItem.items.map((item, index) =>
                    item.link ? (
                      item.link.includes('http' || 'https') ? (
                        <>
                          <a
                            href={item.link}
                            target='_blank'
                            className='ac-footer__link'
                          >
                            {hostname === 'open-dimpact.accept.commonground.nu' ||
                            hostname === 'dimpact.opencatalogi.nl' ? (
                              <>
                                {item.icon ? (
                                  <item.icon className='ac-footer__link-icon' />
                                ) : (
                                  <VISUALS.EXTERNAL_LINK className='ac-footer__link-icon' />
                                )}
                                {item.name}
                                <span className='sr-only'>
                                  Opent in een nieuw tabblad
                                </span>
                              </>
                            ) : (
                              <>
                                {item.name}
                                <span className='sr-only'>
                                  Opent in een nieuw tabblad
                                </span>
                                <VISUALS.EXTERNAL_LINK className='ac-footer__link-icon' />
                              </>
                            )}
                          </a>
                        </>
                      ) : (
                        <Link className='ac-footer__link' to={item.link}>
                          {hostname === 'open-dimpact.accept.commonground.nu' ||
                            (hostname === 'dimpact.opencatalogi.nl' && (
                              <Icon icon={item.icon} />
                            ))}
                          {item.name}
                          {hostname !== 'open-dimpact.accept.commonground.nu' &&
                            hostname !== 'dimpact.opencatalogi.nl' && (
                              <Icon icon={item.icon} />
                            )}
                        </Link>
                      )
                    ) : (
                      <div className='ac-footer__link'>
                        {hostname === 'open-dimpact.accept.commonground.nu' ||
                          (hostname === 'dimpact.opencatalogi.nl' && (
                            <Icon icon={item.icon} />
                          ))}
                        {item.name}
                        {hostname !== 'open-dimpact.accept.commonground.nu' &&
                          hostname !== 'dimpact.opencatalogi.nl' && (
                            <Icon icon={item.icon} />
                          )}
                      </div>
                    )
                  )}
                </nav>
              ))}
            </>
          ) : (
            <>
              <nav className='ac-footer__links' aria-label='Footer menu 1'>
                <h3>{LABELS.THIS_WEBSITE}</h3>
                <ul>{FOOTER_PRIMARY_ABOUT.map(renderLink)}</ul>
              </nav>
              <nav className='ac-footer__links' aria-label='Footer menu 2'>
                <h3>{LABELS.QUICK_LINKS}</h3>
                <ul>{FOOTER_PRIMARY_QUICK.map(renderLink)}</ul>
              </nav>
            </>
          )}
          <div class='ac-footer__logo'>
            <ConLogo variant='footer' />

            {AcCheckIfSpecificHostname() ? (
              <></>
            ) : (
              <span>
                <span>Open Tilburg</span>
                <span>Éen plek voor alle publicaties van Gemeente Tilburg</span>
              </span>
            )}
          </div>
        </AcContainer>
      </section>
      {AcCheckIfSpecificHostname() ? (
        <></>
      ) : (
        <section>
          <AcContainer>
            <nav className='ac-footer__links' aria-label='Footer menu 3'>
              <ul>{FOOTER_SECONDARY.map(renderLink)}</ul>
            </nav>
          </AcContainer>
        </section>
      )}
    </footer>
  );
};

export default withStore(observer(AcFooter));
