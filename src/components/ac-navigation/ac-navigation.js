import React, { useEffect } from 'react';
import { LABELS, VISUALS } from '@constants';
import { Link, useLocation } from 'react-router-dom';

const AcNavigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

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
        {hostname === 'vng.opencatalogi.nl' ? (
          <>
            {pathname !== '/mijn-omgeving' ? (
              <ul>
                <li>
                  <Link to='/login'>
                    <VISUALS.PERSON_ADD />
                    Registreren
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
                  <Link to='#'>
                    <VISUALS.USER />
                    Account
                  </Link>
                </li>
              </ul>
            )}
          </>
        ) : (
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

export default AcNavigation;
