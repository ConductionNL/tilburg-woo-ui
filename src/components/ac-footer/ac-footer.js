import { AcContainer, AcLogo } from '@atoms';
import { LABELS, VISUALS } from '@constants';
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

const AcFooter = () => {
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
          DIMPACT_FOOTER_ITEMS_WHAT_WE_DO,
          DIMPACT_FOOTER_ITEMS_WHO_WE_ARE,
          DIMPACT_FOOTER_ITEMS_INFORMATION,
        ];
      default:
        return [
          VNG_FOOTER_ITEMS_SITEMAP,
          VNG_FOOTER_ITEMS_INFORMATIE,
          VNG_FOOTER_ITEMS_BEDRIJVEN,
        ];
    }
  };

  return (
    <footer className='ac-footer'>
      <h2 className='sr-only'>Footer</h2>
      <AcContainer
        className={AcCheckIfSpecificHostname() ? 'ac-footer__container' : ''}
      >
        {AcCheckIfSpecificHostname() ? (
          <>
            {getFooterItems().map((items, index) => (
              <nav
                className='ac-footer__links'
                key={`footer-menu-${index + 1}`}
                aria-label={`Footer menu ${index + 1}`}
              >
                {items.map((item, index) =>
                  item.href ? (
                    item.href.includes('http' || 'https') ? (
                      <a
                        href={item.href}
                        target='_blank'
                        className='ac-footer__link'
                      >
                        {item.iconLocation && item.iconLocation === 'left' ? (
                          <>
                            {item.icon ? (
                              <item.icon className='ac-footer__link-icon' />
                            ) : (
                              <VISUALS.EXTERNAL_LINK className='ac-footer__link-icon' />
                            )}
                            {item.label}
                            <span className='sr-only'>
                              Opent in een nieuw tabblad
                            </span>
                          </>
                        ) : (
                          <>
                            {item.label}
                            <span className='sr-only'>
                              Opent in een nieuw tabblad
                            </span>
                            <VISUALS.EXTERNAL_LINK className='ac-footer__link-icon' />
                          </>
                        )}
                      </a>
                    ) : (
                      <Link className='ac-footer__link' to={item.href}>
                        {item.icon && item.iconLocation === 'left' && (
                          <item.icon className='ac-footer__link-icon' />
                        )}
                        {item.label}
                        {item.icon && item.iconLocation !== 'left' && (
                          <item.icon className='ac-footer__link-icon' />
                        )}
                      </Link>
                    )
                  ) : (
                    <div className='ac-footer__link'>
                      {item.icon && item.iconLocation === 'left' && (
                        <item.icon className='ac-footer__link-icon' />
                      )}
                      {item.label}
                      {item.icon && item.iconLocation !== 'left' && (
                        <item.icon className='ac-footer__link-icon' />
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

export default AcFooter;
