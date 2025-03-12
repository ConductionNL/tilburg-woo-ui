import React, { useEffect } from 'react';
import { LABELS, VISUALS } from '@constants';
import { Link, useLocation } from 'react-router-dom';

const AcNavigation = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
        <ul>
          <li>
            <Link to='/over-ons'>
              <VISUALS.INFO />
              Over Gemeente
            </Link>
          </li>
          <li>
            <Link to='/zoeken'>
              <VISUALS.SEARCH />
              Zoeken
            </Link>
          </li>
          <li>
            <Link to='/onderwerpen'>
              <VISUALS.THEMES />
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
      </nav>
    </div>
  );
};

export default AcNavigation;
