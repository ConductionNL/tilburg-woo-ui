import { AcContainer, AcLogo } from '@atoms';
import { LABELS, VISUALS } from '@constants';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';
import {
  EXTERNAL_LINKS,
  FOOTER_ITEMS,
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

  const getFooterItems = () => {
    const hostname = window.location.hostname;

    switch (hostname) {
      case 'vng.opencatalogi.nl':
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

  const footerItems = all_menu_items.filter((item) => item.position > 2);

  const hostname = window.location.hostname;

  return (
    <footer className='ac-footer'>
      <h2 className='sr-only'>Footer</h2>
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
                          {hostname === 'open-dimpact.accept.commonground.nu' ? (
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
                        {hostname === 'open-dimpact.accept.commonground.nu' && (
                          <Icon icon={item.icon} />
                        )}
                        {item.name}
                        {hostname !== 'open-dimpact.accept.commonground.nu' && (
                          <Icon icon={item.icon} />
                        )}
                      </Link>
                    )
                  ) : (
                    <div className='ac-footer__link'>
                      {hostname === 'open-dimpact.accept.commonground.nu' && (
                        <Icon icon={item.icon} />
                      )}
                      {item.name}
                      {hostname !== 'open-dimpact.accept.commonground.nu' && (
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
              <ul>
                {FOOTER_ITEMS.map((item, index) => (
                  <li key={index}>
                    <Link to={item.path}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav className='ac-footer__links' aria-label='Footer menu 2'>
              <h3>{LABELS.QUICK_LINKS}</h3>
              <ul>
                {EXTERNAL_LINKS.map((item, index) => (
                  <li>
                    <a href={item.href} target='_blank'>
                      {item.label}
                      <span className='sr-only'>Opent in een nieuw tabblad</span>
                      <VISUALS.EXTERNAL_LINK />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}
        <div class='ac-footer__logo'>
          <AcLogo variant='footer' />

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
    </footer>
  );
};

export default withStore(observer(AcFooter));
