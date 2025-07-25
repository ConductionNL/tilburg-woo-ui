import React, { useEffect } from 'react';
import { LABELS, VISUALS } from '@constants';
import { Link, useLocation } from 'react-router-dom';
import { AcCheckIfSpecificHostname } from '@src/services/ac-check-if-specific-hostname';
import { withStore } from '@stores';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router';

const AcNavigation = ({ store: { menu } }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const pathname = window.location.pathname;

  const { fetchMenus, getMenuFromPosition, is_loading: menu_loading } = menu;
  const menus = getMenuFromPosition(1);

  // Icon component for finding icons based on a variable
  const Icon = ({ icon }) => {
    const Icon = VISUALS[icon];
    if (!Icon) return <></>;
    return <Icon />;
  };

  function setCookie(name, value, maxAgeSeconds, options = {}) {
    const { secure, httpOnly, sameSite } = options;
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; max-age=${maxAgeSeconds}; path=/`;
    if (secure) cookie += '; Secure';
    if (httpOnly) cookie += '; HttpOnly';
    if (sameSite) cookie += `; SameSite=${sameSite}`;
    document.cookie = cookie;
  }

  function getCookie(name) {
    // Split document.cookie on `;` to handle multiple cookies
    const cookieArr = document.cookie.split(';');

    for (let cookie of cookieArr) {
      // Remove leading spaces
      cookie = cookie.trim();
      // Check if this cookie starts with "<name>="
      if (cookie.startsWith(`${encodeURIComponent(name)}=`)) {
        // Return everything after the "<name>="
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }

    return null;
  }

  useEffect(() => {
    setIsMenuOpen(false);
    fetchMenus();
  }, [location]);

  function removeCookie(name) {
    document.cookie = `${encodeURIComponent(
      name
    )}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  const handleLogout = () => {
    setCookie('logout', true, 'never', {
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
    });

    setTimeout(() => {
      removeCookie('nextcloud_user_id');
      if (pathname.includes('/beheer')) {
        navigate('/');
      } else {
        navigate(pathname);
      }
    }, 1000);
  };

  return (
    <div className='ac-navigation'>
      <button
        onClick={() => setIsMenuOpen((prevState) => !prevState)}
        aria-expanded={isMenuOpen}
        aria-haspopup='true'
      >
        {isMenuOpen ? <VISUALS.CLOSE /> : <VISUALS.MENU />}
        {isMenuOpen ? LABELS.CLOSE_SINGULAR : LABELS.MENU}
      </button>
      <nav aria-label='Hoofd'>
        {(menus && !getCookie('nextcloud_user_id') && (
          <ul>
            {menus.items.map((menuItem) => (
              <li>
                <Link to={menuItem.link}>
                  <Icon icon={menuItem.icon} />
                  {menuItem.name}
                </Link>
              </li>
            ))}
          </ul>
        )) ||
          (AcCheckIfSpecificHostname() && (
            <>
              {!pathname.includes('beheer') && !getCookie('nextcloud_user_id') ? (
                <ul>
                  <li>
                    <Link to='/register'>
                      <VISUALS.PERSON_ADD />
                      Aanmelden
                    </Link>
                  </li>
                  <li>
                    <Link to='/login'>
                      <VISUALS.KEY />
                      Inloggen
                    </Link>
                  </li>
                </ul>
              ) : (
                <ul>
                  <li>
                    <Link to='/beheer'>
                      <VISUALS.CHART_LINE />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to='/account'>
                      <VISUALS.USER />
                      Account
                    </Link>
                  </li>
                  <li>
                    <Link to='#' onClick={handleLogout}>
                      <VISUALS.RIGHT_FROM_BRACKET />
                      Logout
                    </Link>
                  </li>
                </ul>
              )}
            </>
          )) || (
            <ul>
              <li>
                <Link to='/over-ons'>
                  <VISUALS.INFO />
                  Over Open Tilburg
                </Link>
              </li>
              <li>
                <Link to='/onderwerpen'>
                  <VISUALS.LIST />
                  Onderwerpen
                </Link>
              </li>
              <li>
                <Link to='/contact'>
                  <VISUALS.CONTACT />
                  Contact
                </Link>
              </li>
            </ul>
          )}
      </nav>
    </div>
  );
};

export default withStore(observer(AcNavigation));
