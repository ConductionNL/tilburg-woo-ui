import * as React from 'react';
import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';

const AcCNavigation = ({ items = [], mobileLogo, layoutClassName }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 992);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubItemClick = (handleClick) => {
    setIsOpen(false);

    handleClick();
  };

  return (
    <div className='ac-c-navigation__container'>
      <div className='ac-c-navigation__menu-toggle-container'>
        {mobileLogo}

        <button
          className='ac-c-navigation__menu-toggle'
          onClick={() => setIsOpen((o) => !o)}
        ></button>
      </div>

      <nav className={clsx('ac-c-navigation__primary', isOpen && 'isOpen')}>
        <ul className='ac-c-navigation__ul'>
          {items.map(({ label, icon, current, link, subItems }, idx) => (
            <li
              className={clsx(
                'ac-c-navigation__li',
                current && 'ac-c-navigation__current'
              )}
              c
              key={idx}
            >
              <Link
                className={clsx(
                  'ac-c-navigation__link',
                  'ac-c-navigation__label',
                  subItems && 'ac-c-navigation__mobile-link',
                  current && 'ac-c-navigation__current-link'
                )}
                to={link}
              >
                {icon && icon}
                {label}{' '}
                {subItems && isMobile && (
                  <FontAwesomeIcon
                    className='ac-c-navigation__toggle-icon'
                    icon={faChevronRight}
                  />
                )}
              </Link>

              {subItems && (
                <ul
                  className={clsx('ac-c-navigation__dropdown', [
                    subItems.length > 8 && 'ac-c-navigation__dropdown-overflow',
                  ])}
                >
                  {subItems.map(({ label, icon, current, handleClick }, idx) => (
                    <li
                      key={idx}
                      className={clsx(
                        'ac-c-navigation__li',
                        current && 'ac-c-navigation__dropdown-current'
                      )}
                      onClick={() => handleSubItemClick(handleClick)}
                    >
                      <Link
                        className={clsx(
                          'ac-c-navigation__link',
                          'ac-c-navigation__label',
                          current && 'ac-c-navigation__dropdown-current-link'
                        )}
                      >
                        {icon}
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AcCNavigation;
