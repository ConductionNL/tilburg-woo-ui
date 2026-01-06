import { AcContainer, ConLogo } from '@atoms';
import { VISUALS } from '@constants';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';
import {
  getFooterLogoTitle,
  getFooterLogoSubtitle,
} from '@constants/container.constants';
// Removed unused footer constants - backend handles all content
import { Link } from 'react-router-dom';

const AcFooter = ({ store: { menu, user } }) => {
  // Icon component for finding icons based on a variable
  const Icon = ({ icon }) => {
    const Icon = VISUALS[icon];
    if (!Icon) return <></>;
    return <Icon className='ac-footer__link-icon' />;
  };

  // Removed renderLink function - backend handles all footer content

  // Backend will handle all footer logic and theming

  // Get footer menus from positions 3, 4, 5 with authentication filtering
  const footerItems = menu.getFooterMenus(user.isAuthenticated);

  const getFooterStaticContent = () => {
    return (
      <span>
        <span>{getFooterLogoTitle() || 'VNG Softwarecatalogus'}</span>
        <span>
          {getFooterLogoSubtitle() ||
            'Één plek voor alle software voor en door Gemeenten'}
        </span>
      </span>
    );
  };

  return (
    <footer className='ac-footer'>
      <h2 className='sr-only'>Footer</h2>
      <section>
        <AcContainer
          className={AcCheckIfSpecificHostname() ? 'ac-footer__container' : ''}
        >
          {AcCheckIfSpecificHostname() ? (
            <>
              {footerItems && footerItems.length > 0
                ? footerItems.map((footerItem, index) => (
                    <nav
                      className='ac-footer__links'
                      key={`footer-menu-${index + 1}`}
                      aria-label={`Footer menu ${index + 1}`}
                    >
                      {/* Menu Title */}
                      {footerItem.title && (
                        <h3 className='ac-footer__menu-title'>{footerItem.title}</h3>
                      )}
                      {footerItem.items && footerItem.items.length > 0 ? (
                        <ul>
                          {footerItem.items.map((item, index) => (
                            <li key={`footer-item-${index}`}>
                              {item.link ? (
                                item.link.includes('http') ||
                                item.link.includes('https') ? (
                                  <a
                                    href={item.link}
                                    target='_blank'
                                    className='ac-footer__link'
                                    rel='noreferrer'
                                  >
                                    {item.icon ? (
                                      <item.icon className='ac-footer__link-icon' />
                                    ) : (
                                      <VISUALS.EXTERNAL_LINK className='ac-footer__link-icon' />
                                    )}
                                    {item.name}
                                    <span className='sr-only'>
                                      Opent in een nieuw tabblad
                                    </span>
                                  </a>
                                ) : (
                                  <Link className='ac-footer__link' to={item.link}>
                                    {item.icon && <Icon icon={item.icon} />}
                                    {item.name}
                                  </Link>
                                )
                              ) : (
                                <div className='ac-footer__link'>
                                  {item.icon && <Icon icon={item.icon} />}
                                  {item.name}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </nav>
                  ))
                : null}
            </>
          ) : null}
          <div className='ac-footer__logo'>
            <ConLogo variant='footer' />
            {getFooterStaticContent()}
          </div>
        </AcContainer>
      </section>
      {/* Sub Footer - Position 6 */}
      {(() => {
        const subFooterItems = menu.getSubFooterMenus(user.isAuthenticated);
        return subFooterItems && subFooterItems.length > 0 ? (
          <section className='ac-footer__sub-footer'>
            <AcContainer>
              {subFooterItems.map((subFooterItem, index) => (
                <nav
                  key={`sub-footer-${index}`}
                  className='ac-footer__sub-footer-links'
                  aria-label={`Sub footer menu ${index + 1}`}
                >
                  {/* Position 6: Display items horizontally without title */}
                  {subFooterItem.items && subFooterItem.items.length > 0 && (
                    <ul className='ac-footer__sub-footer-horizontal'>
                      {subFooterItem.items.map((item, itemIndex) => (
                        <li key={`sub-footer-item-${itemIndex}`}>
                          {item.link ? (
                            item.link.includes('http') ||
                            item.link.includes('https') ? (
                              <a
                                href={item.link}
                                target='_blank'
                                className='ac-footer__sub-footer-link'
                                rel='noreferrer'
                              >
                                {item.icon ? (
                                  <item.icon className='ac-footer__link-icon' />
                                ) : (
                                  <VISUALS.EXTERNAL_LINK className='ac-footer__link-icon' />
                                )}
                                {item.name}
                                <span className='sr-only'>
                                  Opent in een nieuw tabblad
                                </span>
                              </a>
                            ) : (
                              <Link
                                className='ac-footer__sub-footer-link'
                                to={item.link}
                              >
                                {item.icon && <Icon icon={item.icon} />}
                                {item.name}
                              </Link>
                            )
                          ) : (
                            <div className='ac-footer__sub-footer-link'>
                              {item.icon && <Icon icon={item.icon} />}
                              {item.name}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </nav>
              ))}
            </AcContainer>
          </section>
        ) : null;
      })()}
    </footer>
  );
};

export default withStore(observer(AcFooter));
