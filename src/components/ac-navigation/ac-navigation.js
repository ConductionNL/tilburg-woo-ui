import React from 'react';
import { LABELS, VISUALS } from '@constants';
import { Link } from 'react-router-dom';

const AcNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className='ac-navigation'>
      <button
        onClick={() => setIsMenuOpen((prevState) => !prevState)}
        aria-expanded={isMenuOpen}
        aria-haspopup='true'
      >
        {isMenuOpen ? <VISUALS.CLOSE /> : <VISUALS.MENU />}
        {isMenuOpen ? LABELS.CLOSE : LABELS.MENU}
      </button>
      <nav aria-label='Hoofd'>
        <ul>
          <li>
            <Link to='/over-open-tilburg'>
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
      </nav>
    </div>
  );
};

export default AcNavigation;
